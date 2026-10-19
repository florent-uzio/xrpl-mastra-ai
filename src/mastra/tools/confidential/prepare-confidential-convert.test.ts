import { Client, deriveConfidentialKeypair, ECDSA, Wallet } from 'xrpl'
import { describe, expect, it } from 'vitest'
import { prepareConvert } from './prepare-confidential-convert'

const holder = Wallet.generate(ECDSA.secp256k1).classicAddress
const mptIssuanceId = '00000001' + 'A'.repeat(40)
const newSeed = () => Wallet.generate(ECDSA.secp256k1).seed!

const clientWith = (mptoken: Record<string, unknown>) => {
  const issuance = { IssuerEncryptionKey: deriveConfidentialKeypair(newSeed()).publicKey }
  return {
    getLedgerIndex: async () => 5,
    request: async (req: { command: string; mptoken?: unknown }) => ({
      result:
        req.command === 'account_info'
          ? { account_data: { Sequence: 7 } }
          : { node: req.mptoken ? mptoken : issuance },
    }),
  } as unknown as Client
}

describe('prepareConvert', () => {
  it('registers the holder key on the first conversion', async () => {
    const seed = newSeed()
    const txn = await prepareConvert(clientWith({}), { holder, mptIssuanceId, amount: '100', confidentialSeed: seed })
    expect(txn).toMatchObject({
      TransactionType: 'ConfidentialMPTConvert',
      Account: holder,
      MPTAmount: '100',
      Sequence: 7,
      HolderEncryptionKey: deriveConfidentialKeypair(seed).publicKey,
    })
    expect(txn.ZKProof).toBeDefined()
  })

  it('skips the key registration once the key is on the ledger', async () => {
    const seed = newSeed()
    const client = clientWith({ HolderEncryptionKey: deriveConfidentialKeypair(seed).publicKey })
    const txn = await prepareConvert(client, { holder, mptIssuanceId, amount: '100', confidentialSeed: seed })
    expect(txn.HolderEncryptionKey).toBeUndefined()
    expect(txn.ZKProof).toBeUndefined()
    expect(txn.HolderEncryptedAmount).toBeDefined()
  })

  it('rejects a seed that does not match the registered holder key', async () => {
    const client = clientWith({ HolderEncryptionKey: deriveConfidentialKeypair(newSeed()).publicKey })
    await expect(
      prepareConvert(client, { holder, mptIssuanceId, amount: '100', confidentialSeed: newSeed() }),
    ).rejects.toThrow('does not match the holder encryption key')
  })
})
