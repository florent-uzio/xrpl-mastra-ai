import { Client, decode, ECDSA, Wallet } from 'xrpl'
import { describe, expect, it } from 'vitest'
import { signLoanSet, signLoanSetTool } from './sign-loan-set'

const broker = Wallet.generate(ECDSA.secp256k1)
const borrower = Wallet.generate(ECDSA.secp256k1)

const txn = {
  TransactionType: 'LoanSet' as const,
  Account: broker.classicAddress,
  Counterparty: borrower.classicAddress,
  LoanBrokerID: 'A'.repeat(64),
  PrincipalRequested: '100',
}

const client = {
  autofill: async (tx: object) => ({ ...tx, Fee: '24', Sequence: 7, LastLedgerSequence: 30 }),
} as unknown as Client

describe('signLoanSet', () => {
  it('signs as Account and adds the CounterpartySignature', async () => {
    const { tx, tx_blob, hash } = await signLoanSet(client, {
      txn,
      seed: broker.seed!,
      counterpartySeed: borrower.seed!,
    })

    expect(tx).toMatchObject({ SigningPubKey: broker.publicKey, Sequence: 7, LastLedgerSequence: 30 })
    expect(tx.TxnSignature).toBeTruthy()
    expect(tx.CounterpartySignature?.SigningPubKey).toBe(borrower.publicKey)
    expect(tx.CounterpartySignature?.TxnSignature).toBeTruthy()
    expect(decode(tx_blob)).toMatchObject({ CounterpartySignature: tx.CounterpartySignature })
    expect(hash).toMatch(/^[0-9A-F]{64}$/)
  })

  it('rejects a counterparty seed that does not match Counterparty', async () => {
    const other = Wallet.generate(ECDSA.secp256k1)
    await expect(signLoanSet(client, { txn, seed: broker.seed!, counterpartySeed: other.seed! })).rejects.toThrow(
      'not for Counterparty',
    )
  })

  it('rejects a seed that does not match Account', async () => {
    await expect(signLoanSet(client, { txn, seed: borrower.seed!, counterpartySeed: borrower.seed! })).rejects.toThrow(
      'not for Account',
    )
  })
})

describe('signLoanSetTool', () => {
  it('refuses seeds on mainnet', async () => {
    await expect(
      signLoanSetTool.execute!(
        { network: 'wss://xrplcluster.com/', txn, seed: broker.seed!, counterpartySeed: borrower.seed! },
        {} as never,
      ),
    ).rejects.toThrow('not a known test network')
  })
})
