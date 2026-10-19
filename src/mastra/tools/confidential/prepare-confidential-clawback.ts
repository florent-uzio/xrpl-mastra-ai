import { createTool } from '@mastra/core/tools'
import { Client, deriveConfidentialKeypair, fetchMPTokenIssuance, prepareConfidentialClawback } from 'xrpl'
import { z } from 'zod'
import { disconnectXrplClient, getXrplClient, networkSchema, xrplAddressSchema } from '../../../helpers'

type PrepareParams = {
  issuer: string
  holder: string
  mptIssuanceId: string
  confidentialSeed: string
}

/**
 * Builds an unsigned ConfidentialMPTClawback with its ZK proof. The issuer's key decrypts the holder's balance
 * mirror, and the proof binds that amount to the ciphertext, so the amount is always the holder's whole balance.
 */
export const prepareClawback = async (client: Client, params: PrepareParams) => {
  const { issuer, holder, mptIssuanceId, confidentialSeed } = params
  const issuerKeypair = deriveConfidentialKeypair(confidentialSeed)

  const issuance = await fetchMPTokenIssuance(client, mptIssuanceId)
  if (issuance.IssuerEncryptionKey !== issuerKeypair.publicKey) {
    throw new Error('The confidentialSeed does not match the issuer encryption key registered on the ledger')
  }

  return prepareConfidentialClawback(client, { account: issuer, holder, mptIssuanceID: mptIssuanceId, issuerKeypair })
}

export const prepareConfidentialClawbackTool = createTool({
  id: 'prepare-confidential-clawback',
  description: `Generate the ZK proof for a ConfidentialMPTClawback and return the unsigned transaction. Read-only, nothing is submitted.

A confidential clawback is all-or-nothing: the proof ties MPTAmount to the issuer's encrypted copy of the holder's balance, so MPTAmount is always the holder's whole confidential balance (inbox + spending). A smaller amount cannot be proven (tecBAD_PROOF). To leave the holder a part, claw back everything, then pay the remainder back.

Input:
- network: websocket URL
- issuer: the issuer address (sends the transaction)
- holder: the holder to claw back from
- mptIssuanceId: hex ID of the MPT issuance
- confidentialSeed: the family seed of the issuer's ElGamal key (not the wallet seed). A flow record has it as confidentialSeed(s).

Output: the transaction with MPTAmount, ZKProof and Sequence set. Pass it as-is to submit-confidential-mpt-clawback (keep Sequence: the proof is bound to it), and submit it right away, before the issuer sends anything else. Lock the holder first so the balance doesn't change. It cannot be used as a Batch inner.

Decryption is a brute-force search that takes about 3 s per 1,000,000 of the issuance's total confidential amount.

The seed is a secret: never repeat it.`,
  inputSchema: z.object({
    network: networkSchema,
    issuer: xrplAddressSchema.describe('Issuer address, the sender of the clawback'),
    holder: xrplAddressSchema.describe('Holder whose whole confidential balance is clawed back'),
    mptIssuanceId: z.string().describe('Hex ID of the MPT issuance'),
    confidentialSeed: z.string().describe('SECRET: family seed of the issuer ElGamal key, not the wallet seed'),
  }),
  outputSchema: z.object({
    txn: z.looseObject({}).describe('Unsigned ConfidentialMPTClawback, ready for submit-confidential-mpt-clawback'),
    amount: z.string().describe('Whole confidential balance being clawed back (MPTAmount)'),
  }),
  execute: async (inputData, { mastra }) => {
    const client = await getXrplClient(inputData.network, mastra)
    try {
      const txn = await prepareClawback(client, inputData)
      return { txn, amount: txn.MPTAmount }
    } finally {
      await disconnectXrplClient(inputData.network, mastra)
    }
  },
})
