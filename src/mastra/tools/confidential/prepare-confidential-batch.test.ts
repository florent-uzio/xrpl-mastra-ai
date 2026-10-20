import { Client, deriveConfidentialKeypair, ECDSA, GlobalFlags, Wallet } from 'xrpl'
import { describe, expect, it } from 'vitest'
import { prepareBatch, errorMessage } from './prepare-confidential-batch'

const wallet = () => Wallet.generate(ECDSA.secp256k1)
const holder = wallet().classicAddress
const other = wallet().classicAddress
const mptIssuanceId = '00000001' + 'A'.repeat(40)
const seed = wallet().seed!

const client = {
  getLedgerIndex: async () => 5,
  request: async (req: { command: string; mptoken?: unknown }) => ({
    result:
      req.command === 'account_info'
        ? { account_data: { Sequence: 7 } }
        : { node: req.mptoken ? {} : { IssuerEncryptionKey: deriveConfidentialKeypair(wallet().seed!).publicKey } },
  }),
  autofill: async (txn: object) => ({ ...txn, Fee: '40', LastLedgerSequence: 30 }),
} as unknown as Client

describe('prepareBatch', () => {
  it('generates the confidential inner proofs and sequences every inner', async () => {
    const batch = await prepareBatch(client, {
      account: holder,
      inners: [
        { operation: 'convert', account: holder, mptIssuanceId, amount: '100', confidentialSeed: seed },
        { TransactionType: 'Payment', Account: holder, Destination: other, Amount: '10' },
      ],
    })

    const [convert, payment] = batch.RawTransactions.map(({ RawTransaction }) => RawTransaction)
    expect(batch).toMatchObject({ TransactionType: 'Batch', Account: holder, Sequence: 7, Fee: '40' })
    expect(convert).toMatchObject({
      TransactionType: 'ConfidentialMPTConvert',
      MPTAmount: '100',
      Sequence: 8,
      Fee: '0',
      HolderEncryptionKey: deriveConfidentialKeypair(seed).publicKey,
    })
    expect(convert.ZKProof).toBeDefined()
    expect(payment).toMatchObject({ TransactionType: 'Payment', Sequence: 9, Fee: '0' })
    expect((convert.Flags as number) & GlobalFlags.tfInnerBatchTxn).toBeTruthy()
  })
})

describe('errorMessage', () => {
  it('makes any thrown value readable', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom')
    expect(errorMessage({ code: 5, reason: 'bad proof' })).toBe('{"code":5,"reason":"bad proof"}')
    expect(errorMessage('plain')).toBe('plain')
  })
})
