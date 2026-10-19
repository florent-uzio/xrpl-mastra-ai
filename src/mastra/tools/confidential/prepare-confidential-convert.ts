import { createTool } from '@mastra/core/tools'
import { Client, deriveConfidentialKeypair, fetchMPToken, prepareConfidentialConvert } from 'xrpl'
import { z } from 'zod'
import { disconnectXrplClient, getXrplClient, networkSchema, xrplAddressSchema } from '../../../helpers'

type PrepareParams = {
  holder: string
  mptIssuanceId: string
  amount: string
  confidentialSeed: string
}

/**
 * Builds an unsigned ConfidentialMPTConvert with the blinding factor, ciphertexts and, on the holder's first
 * conversion, the key registration and its proof.
 */
export const prepareConvert = async (client: Client, params: PrepareParams) => {
  const { holder, mptIssuanceId, amount, confidentialSeed } = params
  const holderKeypair = deriveConfidentialKeypair(confidentialSeed)

  const registeredKey = (await fetchMPToken(client, holder, mptIssuanceId)).HolderEncryptionKey
  if (registeredKey && registeredKey !== holderKeypair.publicKey) {
    throw new Error('The confidentialSeed does not match the holder encryption key registered on the ledger')
  }

  return prepareConfidentialConvert(client, {
    account: holder,
    mptIssuanceID: mptIssuanceId,
    amount: BigInt(amount),
    holderKeypair,
  })
}

export const prepareConfidentialConvertTool = createTool({
  id: 'prepare-confidential-convert',
  description: `Generate the ciphertexts (and key registration proof when needed) for a ConfidentialMPTConvert and return the unsigned transaction. Read-only, nothing is submitted.

Input:
- network: websocket URL
- holder: the holder address (sends the transaction); it must already hold the MPT and have at least "amount" of public balance
- mptIssuanceId: hex ID of the MPT issuance (must have the issuer encryption key registered)
- amount: public amount to convert to confidential (integer string)
- confidentialSeed: the family seed of the holder's ElGamal key (not the wallet seed). A flow record has it as confidentialSeed(s). If the holder has not registered a key yet, any new seed works and the key is registered by this transaction.

Output: the transaction with BlindingFactor, HolderEncryptedAmount, IssuerEncryptedAmount, AuditorEncryptedAmount (if the issuance has an auditor), HolderEncryptionKey and ZKProof (first conversion only) and Sequence set. Pass it as-is to submit-confidential-mpt-convert (keep Sequence: the proof is bound to it), and submit it right away, before the holder sends anything else. The converted amount lands in the inbox: merge it before spending it.

The seed is a secret: never repeat it.`,
  inputSchema: z.object({
    network: networkSchema,
    holder: xrplAddressSchema.describe('Holder address, the sender of the convert'),
    mptIssuanceId: z.string().describe('Hex ID of the MPT issuance'),
    amount: z.string().regex(/^\d+$/).describe('Public amount to convert (integer string)'),
    confidentialSeed: z.string().describe('SECRET: family seed of the holder ElGamal key, not the wallet seed'),
  }),
  outputSchema: z.object({
    txn: z.looseObject({}).describe('Unsigned ConfidentialMPTConvert, ready for submit-confidential-mpt-convert'),
    registersKey: z.boolean().describe('True when this transaction also registers the holder encryption key'),
  }),
  execute: async (inputData, { mastra }) => {
    const client = await getXrplClient(inputData.network, mastra)
    try {
      const txn = await prepareConvert(client, inputData)
      return { txn, registersKey: txn.HolderEncryptionKey != null }
    } finally {
      await disconnectXrplClient(inputData.network, mastra)
    }
  },
})
