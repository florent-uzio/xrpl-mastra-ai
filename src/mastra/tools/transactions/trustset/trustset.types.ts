import { z } from 'zod'
import { xrplCurrencyAmountSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * TrustSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/trustset#trustset-fields
 */
export const xrplTrustSetFieldsSchema = z.object({
  // Required field
  LimitAmount: xrplCurrencyAmountSchema.describe(
    'Object defining the trust line to create or modify. Required field for TrustSet transactions.',
  ),

  // Optional fields
  QualityIn: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe(
      'Value incoming balances at this ratio per 1,000,000,000 units. 0 = face value. Example: 10,000,000 means 1% fee (sender keeps 1%, destination gets 99%)',
    ),
  QualityOut: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe(
      'Value outgoing balances at this ratio per 1,000,000,000 units. 0 = face value. Example: 10,000,000 means 1% fee (issuer keeps 1%, destination gets 99%)',
    ),
})

/**
 * Complete TrustSet transaction schema
 */
export const xrplTrustSetSchema = xrplCommonFieldsSchema
  .merge(xrplTrustSetFieldsSchema)
  .extend({ TransactionType: z.literal('TrustSet') })

export type XrplTrustSetFields = z.infer<typeof xrplTrustSetFieldsSchema>
export type XrplTrustSet = z.infer<typeof xrplTrustSetSchema>
