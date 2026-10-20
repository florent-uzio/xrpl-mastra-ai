import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplAssetAmountSchema } from '../shared/asset'
import { xrplHash256Schema } from '../shared/transaction-fields'

/**
 * CheckCreate-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/checkcreate#checkcreate-fields
 */
export const xrplCheckCreateFieldsSchema = z.object({
  Destination: xrplAddressSchema.describe('The account that can cash the Check (r-address). Cannot be the sender.'),
  SendMax: xrplAssetAmountSchema.describe(
    'Maximum amount of source currency the Check is allowed to debit the sender, including transfer fees on non-XRP currencies. XRP in drops (string) or a token amount {currency, issuer, value}.',
  ),
  DestinationTag: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe('Arbitrary tag identifying the reason for the Check or a hosted recipient at the destination'),
  Expiration: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe(
      'Time after which the Check is no longer valid, in seconds since the Ripple Epoch (2000-01-01T00:00:00Z), not Unix time',
    ),
  InvoiceID: xrplHash256Schema
    .optional()
    .describe('Arbitrary 256-bit hash (64 hex characters) representing a specific reason or identifier for this Check'),
})

/**
 * Complete CheckCreate transaction schema
 */
export const xrplCheckCreateSchema = xrplCommonFieldsSchema
  .merge(xrplCheckCreateFieldsSchema)
  .extend({ TransactionType: z.literal('CheckCreate') })

export type XrplCheckCreateFields = z.infer<typeof xrplCheckCreateFieldsSchema>
export type XrplCheckCreate = z.infer<typeof xrplCheckCreateSchema>
