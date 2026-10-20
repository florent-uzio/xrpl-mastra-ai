import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHash256Schema } from '../shared/transaction-fields'

const hexSchema = z
  .string()
  .regex(/^([0-9A-Fa-f]{2})+$/, 'Must be a non-empty hex string with an even number of characters')

/**
 * EscrowFinish-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/escrowfinish#escrowfinish-fields
 */
export const xrplEscrowFinishFieldsSchema = z.object({
  Owner: xrplAddressSchema.describe('The address of the account that funded the escrow (the EscrowCreate sender)'),
  OfferSequence: z
    .number()
    .int()
    .gte(0)
    .describe(
      'Transaction sequence (or Ticket number) of the EscrowCreate transaction that created the escrow to finish',
    ),
  Condition: hexSchema
    .optional()
    .describe(
      "Hex-encoded PREIMAGE-SHA-256 crypto-condition of the escrow; must match the escrow's Condition. Required together with Fulfillment for conditional escrows.",
    ),
  Fulfillment: hexSchema
    .optional()
    .describe(
      "Hex-encoded PREIMAGE-SHA-256 fulfillment matching the escrow's Condition. Required for conditional escrows; omit for time-only escrows. Incurs extra fee (330 drops plus 10 drops per 16 bytes of fulfillment).",
    ),
  CredentialIDs: z
    .array(xrplHash256Schema)
    .max(8)
    .optional()
    .describe(
      'Credential ledger entry IDs (64-character hex each, up to 8) proving the sender is authorized to receive funds when the destination uses Deposit Authorization with credentials',
    ),
})

/**
 * Complete EscrowFinish transaction schema
 */
export const xrplEscrowFinishSchema = xrplCommonFieldsSchema
  .merge(xrplEscrowFinishFieldsSchema)
  .extend({ TransactionType: z.literal('EscrowFinish') })

export type XrplEscrowFinishFields = z.infer<typeof xrplEscrowFinishFieldsSchema>
export type XrplEscrowFinish = z.infer<typeof xrplEscrowFinishSchema>
