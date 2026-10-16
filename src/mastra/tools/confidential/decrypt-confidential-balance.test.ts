import { Client, deriveConfidentialKeypair, ECDSA, loadMptCrypto, Wallet } from 'xrpl'
import { beforeAll, describe, expect, it } from 'vitest'
import { decryptConfidentialBalance } from './decrypt-confidential-balance'

const holder = 'rHolder'
const mptIssuanceId = 'ID'
const newSeed = () => Wallet.generate(ECDSA.secp256k1).seed!

describe('decryptConfidentialBalance', () => {
  const seeds = { holder: newSeed(), issuer: newSeed(), auditor: newSeed() }
  let client: Client

  beforeAll(async () => {
    const crypto = await loadMptCrypto()
    const encrypt = async (amount: bigint, seed: string) =>
      crypto.encryptAmount(amount, deriveConfidentialKeypair(seed).publicKey, await crypto.generateBlindingFactor())
    const mptoken = {
      HolderEncryptionKey: deriveConfidentialKeypair(seeds.holder).publicKey,
      ConfidentialBalanceSpending: await encrypt(70n, seeds.holder),
      ConfidentialBalanceInbox: await encrypt(30n, seeds.holder),
      IssuerEncryptedBalance: await encrypt(100n, seeds.issuer),
      AuditorEncryptedBalance: await encrypt(100n, seeds.auditor),
    }
    const issuance = {
      IssuerEncryptionKey: deriveConfidentialKeypair(seeds.issuer).publicKey,
      AuditorEncryptionKey: deriveConfidentialKeypair(seeds.auditor).publicKey,
      ConfidentialOutstandingAmount: '100',
    }
    client = {
      getLedgerIndex: async () => 5,
      request: async (req: { mptoken?: unknown }) => ({ result: { node: req.mptoken ? mptoken : issuance } }),
    } as unknown as Client
  })

  const run = (role: 'holder' | 'issuer' | 'auditor', confidentialSeed: string) =>
    decryptConfidentialBalance(client, { holder, mptIssuanceId, role, confidentialSeed })

  it('lets the holder read its spending and inbox balances', async () => {
    expect(await run('holder', seeds.holder)).toEqual({ spending: 70n, inbox: 30n, total: 100n, ledgerIndex: 5 })
  })

  it('lets the issuer and the auditor read the holder total', async () => {
    expect(await run('issuer', seeds.issuer)).toMatchObject({ total: 100n, ledgerIndex: 5 })
    expect(await run('auditor', seeds.auditor)).toMatchObject({ total: 100n, ledgerIndex: 5 })
  })

  it('rejects a seed that does not match the registered key', async () => {
    await expect(run('auditor', seeds.issuer)).rejects.toThrow('does not match the auditor encryption key')
  })
})
