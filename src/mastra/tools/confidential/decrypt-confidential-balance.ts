import { createTool } from '@mastra/core/tools'
import { Client, deriveConfidentialKeypair, fetchMPToken, fetchMPTokenIssuance, loadMptCrypto } from 'xrpl'
import { z } from 'zod'
import { disconnectXrplClient, getXrplClient, networkSchema, xrplAddressSchema } from '../../../helpers'

const roleSchema = z.enum(['holder', 'issuer', 'auditor'])
type Role = z.infer<typeof roleSchema>

type DecryptParams = {
  holder: string
  mptIssuanceId: string
  role: Role
  confidentialSeed: string
}

/**
 * Decrypts a holder's confidential balance with the key of one of the three parties that can read it:
 * the holder (spending and inbox balances), the issuer or the auditor (each has a copy of the total).
 * The key must match the one registered on the ledger, otherwise the decryption would just fail.
 */
export const decryptConfidentialBalance = async (client: Client, params: DecryptParams) => {
  const { holder, mptIssuanceId, role, confidentialSeed } = params
  const keypair = deriveConfidentialKeypair(confidentialSeed)

  // Read both objects from the same ledger so the ciphertexts and the decryption bound agree
  const ledgerIndex = await client.getLedgerIndex()
  const [mptoken, issuance, crypto] = await Promise.all([
    fetchMPToken(client, holder, mptIssuanceId, ledgerIndex),
    fetchMPTokenIssuance(client, mptIssuanceId, ledgerIndex),
    loadMptCrypto(),
  ])

  const registeredKey = {
    holder: mptoken.HolderEncryptionKey,
    issuer: issuance.IssuerEncryptionKey,
    auditor: issuance.AuditorEncryptionKey,
  }[role]
  if (!registeredKey) {
    throw new Error(`No ${role} encryption key is registered for ${role === 'holder' ? holder : mptIssuanceId}`)
  }
  if (registeredKey !== keypair.publicKey) {
    throw new Error(`The confidentialSeed does not match the ${role} encryption key registered on the ledger`)
  }

  // Brute-forces the discrete log up to this bound: the issuance's total confidential amount is the tightest one
  const bound = BigInt(issuance.ConfidentialOutstandingAmount ?? 0)
  const decrypt = async (ciphertext?: string) =>
    ciphertext == null ? 0n : await crypto.decryptAmount(ciphertext, keypair.privateKey, bound)

  if (role === 'holder') {
    const [spending, inbox] = await Promise.all([
      decrypt(mptoken.ConfidentialBalanceSpending),
      decrypt(mptoken.ConfidentialBalanceInbox),
    ])
    return { spending, inbox, total: spending + inbox, ledgerIndex }
  }

  const total = await decrypt(role === 'issuer' ? mptoken.IssuerEncryptedBalance : mptoken.AuditorEncryptedBalance)
  return { spending: undefined, inbox: undefined, total, ledgerIndex }
}

export const decryptConfidentialBalanceTool = createTool({
  id: 'decrypt-confidential-balance',
  description: `Decrypt a holder's confidential MPT balance (ConfidentialTransfer). Read-only, nothing is submitted. Works for the holder, the issuer, or an auditor whose ElGamal key is registered on the issuance.

Input:
- network: websocket URL
- mptIssuanceId: hex ID of the MPT issuance
- holder: address of the holder whose balance to decrypt (for role "holder", its own address)
- role: whose key is used. "holder" returns spending, inbox and total. "issuer" and "auditor" return the holder's total (spending + inbox).
- confidentialSeed: the family seed of that party's ElGamal key (not the wallet seed). A flow record has it as confidentialSeed(s).

The seed must match the key registered on the ledger (MPToken HolderEncryptionKey, or the issuance IssuerEncryptionKey / AuditorEncryptionKey). Amounts are returned as integer strings in the MPT's base units. Decryption is a brute-force search that takes about 3 s per 1,000,000 of the issuance's total confidential amount, so large supplies are slow.

The seed is a secret: never repeat it.`,
  inputSchema: z.object({
    network: networkSchema,
    mptIssuanceId: z.string().describe('Hex ID of the MPT issuance'),
    holder: xrplAddressSchema.describe('Address of the holder whose confidential balance to decrypt'),
    role: roleSchema.describe('Whose ElGamal key decrypts: holder, issuer or auditor'),
    confidentialSeed: z.string().describe('SECRET: family seed of the ElGamal (confidential) key, not the wallet seed'),
  }),
  outputSchema: z.object({
    holder: z.string(),
    role: roleSchema,
    ledgerIndex: z.number().describe('Validated ledger the balance was read at'),
    total: z.string().describe('Spending + inbox balance'),
    spending: z.string().optional().describe('Holder role only: spendable balance'),
    inbox: z.string().optional().describe('Holder role only: received but not yet merged into spending'),
  }),
  execute: async (inputData, { mastra }) => {
    const { network, holder, role } = inputData
    const client = await getXrplClient(network, mastra)
    try {
      const { ledgerIndex, total, spending, inbox } = await decryptConfidentialBalance(client, inputData)
      return {
        holder,
        role,
        ledgerIndex: Number(ledgerIndex),
        total: total.toString(),
        spending: spending?.toString(),
        inbox: inbox?.toString(),
      }
    } finally {
      await disconnectXrplClient(network, mastra)
    }
  },
})
