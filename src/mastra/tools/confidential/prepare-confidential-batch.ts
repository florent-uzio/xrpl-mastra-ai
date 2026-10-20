import { createTool } from '@mastra/core/tools'
import {
  Client,
  ConfidentialBatchInner,
  ConfidentialBatchOperation,
  deriveConfidentialKeypair,
  prepareConfidentialBatch,
  SubmittableTransaction,
} from 'xrpl'
import { z } from 'zod'
import { getXrplClient, networkSchema, xrplAddressSchema } from '../../../helpers'

const mptIssuanceId = z.string().describe('Hex ID of the MPT issuance')
const amount = z.string().regex(/^\d+$/).describe('Integer string')
const confidentialSeed = z
  .string()
  .describe('SECRET: family seed of the ElGamal key of the account, not the wallet seed')

const confidentialOperationSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('convert'),
    account: xrplAddressSchema.describe('Holder'),
    mptIssuanceId,
    amount,
    confidentialSeed,
  }),
  z.object({
    operation: z.literal('convertBack'),
    account: xrplAddressSchema.describe('Holder'),
    mptIssuanceId,
    amount,
    confidentialSeed,
  }),
  z.object({
    operation: z.literal('send'),
    account: xrplAddressSchema.describe('Sender'),
    destination: xrplAddressSchema,
    mptIssuanceId,
    amount,
    confidentialSeed,
    destinationTag: z.number().optional(),
  }),
  z.object({ operation: z.literal('mergeInbox'), account: xrplAddressSchema.describe('Holder'), mptIssuanceId }),
  z.object({
    operation: z.literal('clawback'),
    account: xrplAddressSchema.describe('Issuer'),
    holder: xrplAddressSchema,
    mptIssuanceId,
    confidentialSeed: confidentialSeed.describe('SECRET: family seed of the issuer ElGamal key'),
  }),
])

const plainInnerSchema = z.looseObject({
  TransactionType: z.string().describe('e.g. "Payment"'),
  Account: xrplAddressSchema,
})

type ConfidentialOperation = z.infer<typeof confidentialOperationSchema>

const toXrplOperation = (op: ConfidentialOperation): ConfidentialBatchOperation => {
  const { mptIssuanceId: mptIssuanceID, ...rest } = op
  switch (rest.operation) {
    case 'convert':
    case 'convertBack':
      return {
        operation: rest.operation,
        account: rest.account,
        mptIssuanceID,
        amount: BigInt(rest.amount),
        holderKeypair: deriveConfidentialKeypair(rest.confidentialSeed),
      }
    case 'send':
      return {
        operation: 'send',
        account: rest.account,
        destination: rest.destination,
        mptIssuanceID,
        amount: BigInt(rest.amount),
        senderKeypair: deriveConfidentialKeypair(rest.confidentialSeed),
        destinationTag: rest.destinationTag,
      }
    case 'mergeInbox':
      return { operation: 'mergeInbox', account: rest.account, mptIssuanceID }
    case 'clawback':
      return {
        operation: 'clawback',
        account: rest.account,
        holder: rest.holder,
        mptIssuanceID,
        issuerKeypair: deriveConfidentialKeypair(rest.confidentialSeed),
      }
  }
}

const isOperation = (inner: ConfidentialOperation | z.infer<typeof plainInnerSchema>): inner is ConfidentialOperation =>
  'operation' in inner

type PrepareParams = {
  account: string
  inners: (ConfidentialOperation | z.infer<typeof plainInnerSchema>)[]
  batchFlags?: number
  signersCount?: number
}

/** Thrown errors show as [object Object] in Studio, and the crypto layer can throw plain objects */
export const errorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return typeof error === 'string' ? error : (JSON.stringify(error) ?? String(error))
}

/**
 * Builds an unsigned Batch whose confidential inners carry their ZK proofs and ciphertexts. xrpl.js predicts the
 * confidential balances across the inners and assigns each inner its Sequence, as the proofs are bound to both.
 */
export const prepareBatch = async (client: Client, params: PrepareParams) => {
  const { account, inners, batchFlags, signersCount } = params
  return prepareConfidentialBatch(client, {
    account,
    batchFlags,
    signersCount,
    inners: inners.map(inner =>
      isOperation(inner) ? toXrplOperation(inner) : (inner as unknown as SubmittableTransaction),
    ) satisfies ConfidentialBatchInner[],
  })
}

export const prepareConfidentialBatchTool = createTool({
  id: 'prepare-confidential-batch',
  description: `Build the unsigned Batch for a Batch that contains at least one confidential MPT operation (convert, convertBack, send, mergeInbox, clawback). Read-only, nothing is submitted. ALWAYS use this instead of building the inner transactions by hand: their ZK proofs and ciphertexts depend on the Sequence of each inner and on the confidential balances as changed by the previous inners, which only this tool computes.

Input:
- network: websocket URL
- account: the outer Batch account (sends the Batch)
- inners: 2 to 8 items, in order. Either a confidential operation:
  - {operation:"convert", account, mptIssuanceId, amount, confidentialSeed}
  - {operation:"convertBack", account, mptIssuanceId, amount, confidentialSeed}
  - {operation:"send", account, destination, mptIssuanceId, amount, confidentialSeed, destinationTag?}
  - {operation:"mergeInbox", account, mptIssuanceId}
  - {operation:"clawback", account (issuer), holder, mptIssuanceId, confidentialSeed (issuer)}
  or a plain transaction ({TransactionType, Account, ...} e.g. a Payment).
- batchFlags: one mode: 65536 tfAllOrNothing (default), 131072 tfOnlyOne, 262144 tfUntilFailure, 524288 tfIndependent
- signersCount: number of inner accounts other than "account" (they sign as BatchSigners; used for the fee)

confidentialSeed is the family seed of the ElGamal key (not the wallet seed); a flow record has it as confidentialSeed(s). The destination of a send must already have a registered holder key.

Limits: a mergeInbox or clawback resets balances the client cannot predict, so later operations on the same holder in the same Batch fail with an error: split those across separate Batches. A holder that has no key yet is registered by its convert.

Output: on failure only {error} (a Batch cannot hold a mergeInbox or clawback followed by another operation on the same holder: split it). Otherwise the Batch with Sequence, Fee, LastLedgerSequence and every inner (Sequence, Fee "0", tfInnerBatchTxn) set. Pass it as-is to submit-batch (innerSeeds for inner accounts other than the outer account, on testnet/devnet) and submit it right away.

Seeds are secrets: never repeat them.`,
  inputSchema: z.object({
    network: networkSchema,
    account: xrplAddressSchema.describe('Outer Batch account'),
    inners: z
      .array(z.union([confidentialOperationSchema, plainInnerSchema]))
      .min(2)
      .max(8),
    batchFlags: z.number().optional().describe('Batch mode flag, default tfAllOrNothing 65536'),
    signersCount: z.number().int().min(0).optional().describe('Inner accounts other than the outer account'),
  }),
  outputSchema: z.object({
    txn: z.looseObject({}).optional().describe('Unsigned Batch, ready for submit-batch'),
    error: z.string().optional().describe('Why the Batch could not be prepared (no txn is returned)'),
  }),
  execute: async (inputData, { mastra }) => {
    const client = await getXrplClient(inputData.network, mastra)
    try {
      return { txn: await prepareBatch(client, inputData) }
    } catch (error) {
      return { error: errorMessage(error) }
    }
  },
})
