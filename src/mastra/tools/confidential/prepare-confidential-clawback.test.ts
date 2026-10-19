import { Client, deriveConfidentialKeypair, ECDSA, loadMptCrypto, Wallet } from 'xrpl'
import { beforeAll, describe, expect, it } from 'vitest'
import { prepareClawback } from './prepare-confidential-clawback'

const issuer = Wallet.generate(ECDSA.secp256k1).classicAddress
const holder = Wallet.generate(ECDSA.secp256k1).classicAddress
const mptIssuanceId = '00000001' + 'A'.repeat(40)
const newSeed = () => Wallet.generate(ECDSA.secp256k1).seed!

describe('prepareClawback', () => {
  const issuerSeed = newSeed()
  let client: Client

  beforeAll(async () => {
    const crypto = await loadMptCrypto()
    const issuerKey = deriveConfidentialKeypair(issuerSeed).publicKey
    const mptoken = {
      IssuerEncryptedBalance: await crypto.encryptAmount(200n, issuerKey, await crypto.generateBlindingFactor()),
    }
    const issuance = { IssuerEncryptionKey: issuerKey, ConfidentialOutstandingAmount: '200' }
    client = {
      getLedgerIndex: async () => 5,
      request: async (req: { command: string; mptoken?: unknown }) => ({
        result:
          req.command === 'account_info'
            ? { account_data: { Sequence: 7 } }
            : { node: req.mptoken ? mptoken : issuance },
      }),
    } as unknown as Client
  })

  it("claws back the holder's whole balance with a proof bound to the sequence", async () => {
    const txn = await prepareClawback(client, { issuer, holder, mptIssuanceId, confidentialSeed: issuerSeed })
    expect(txn).toMatchObject({
      TransactionType: 'ConfidentialMPTClawback',
      Account: issuer,
      Holder: holder,
      MPTokenIssuanceID: mptIssuanceId,
      MPTAmount: '200',
      Sequence: 7,
    })
    expect(txn.ZKProof).toHaveLength(128)
  })

  it('rejects a seed that does not match the registered issuer key', async () => {
    await expect(
      prepareClawback(client, { issuer, holder, mptIssuanceId, confidentialSeed: newSeed() }),
    ).rejects.toThrow('does not match the issuer encryption key')
  })
})
