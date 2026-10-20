import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplAssetAmountSchema } from '../shared/asset'

/**
 * EscrowCreate-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/escrowcreate#escrowcreate-fields
 */
export const xrplEscrowCreateFieldsSchema = z.object({
  Amount: xrplAssetAmountSchema.describe(
    'Amount to deduct from the sender and hold in escrow. XRP in drops (string), or a token amount {currency, issuer, value} or MPT amount {mpt_issuance_id, value} (tokens require the issuer to allow escrow: lsfAllowTrustLineLocking for trust line tokens, lsfMPTCanEscrow for MPTs; needs the TokenEscrow amendment).',
  ),
  Destination: xrplAddressSchema.describe('Address that receives the funds when the escrow is released (r-address)'),
  CancelAfter: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe(
      'Time after which the escrow can only be cancelled, in seconds since the Ripple Epoch (2000-01-01T00:00:00Z), not Unix time. If both CancelAfter and FinishAfter are set, CancelAfter must be later than FinishAfter.',
    ),
  FinishAfter: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe(
      'Time after which the funds can be released, in seconds since the Ripple Epoch (2000-01-01T00:00:00Z), not Unix time. Makes this a time-held escrow.',
    ),
  Condition: z
    .string()
    .regex(/^([0-9A-Fa-f]{2})+$/, 'Must be a non-empty hex string with an even number of characters')
    .optional()
    .describe(
      'Hex-encoded PREIMAGE-SHA-256 crypto-condition (PREIMAGE-SHA-256 type only). The escrow can only be finished by providing the matching Fulfillment. If used without FinishAfter, CancelAfter is required.',
    ),
  DestinationTag: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe('Arbitrary tag identifying the reason for the escrow or a hosted recipient at the destination'),
})

/**
 * Complete EscrowCreate transaction schema
 * Rule: at least one of CancelAfter or FinishAfter is required, and a Condition-only escrow must have CancelAfter.
 */
export const xrplEscrowCreateSchema = xrplCommonFieldsSchema
  .merge(xrplEscrowCreateFieldsSchema)
  .extend({ TransactionType: z.literal('EscrowCreate') })

export type XrplEscrowCreateFields = z.infer<typeof xrplEscrowCreateFieldsSchema>
export type XrplEscrowCreate = z.infer<typeof xrplEscrowCreateSchema>
