import { z } from 'zod'
import { xrplCurrencyAmountSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * TrustSet flags that can be used to control trust line behavior
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/trustset#trustset-flags
 */
export const TrustSetFlagsSchema = z.enum([
  'tfSetfAuth', // 65536 - Authorize the other party to hold currency issued by this account
  'tfSetNoRipple', // 131072 - Enable No Ripple flag to block rippling
  'tfClearNoRipple', // 262144 - Disable No Ripple flag to allow rippling
  'tfSetFreeze', // 1048576 - Freeze the trust line
  'tfClearFreeze', // 2097152 - Unfreeze the trust line
  'tfSetDeepFreeze', // 4194304 - Deep Freeze the trust line
  'tfClearDeepFreeze', // 8388608 - Clear Deep Freeze on the trust line
])

export type TrustSetFlags = z.infer<typeof TrustSetFlagsSchema>

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
//   .refine(
//     data => {
//       // Validate that currency is not "XRP" (XRP doesn't need trust lines)
//       if (data.LimitAmount.currency.toUpperCase() === 'XRP') {
//         return false
//       }
//       return true
//     },
//     {
//       message: 'Currency cannot be "XRP" - XRP does not require trust lines',
//       path: ['LimitAmount', 'currency'],
//     },
//   )
//   .refine(
//     data => {
//       // Validate that issuer is not the same as Account (self-trust lines are not allowed)
//       if (data.LimitAmount.issuer === data.Account) {
//         return false
//       }
//       return true
//     },
//     {
//       message: 'Cannot create trust line to yourself (issuer cannot be the same as Account)',
//       path: ['LimitAmount', 'issuer'],
//     },
//   )

export type XrplTrustSetFields = z.infer<typeof xrplTrustSetFieldsSchema>
export type XrplTrustSet = z.infer<typeof xrplTrustSetSchema>

/**
 * Helper function to convert TrustSet flag names to numeric values
 */
export const getTrustSetFlagValue = (flagName: TrustSetFlags): number => {
  const flagValues: Record<TrustSetFlags, number> = {
    tfSetfAuth: 65536,
    tfSetNoRipple: 131072,
    tfClearNoRipple: 262144,
    tfSetFreeze: 1048576,
    tfClearFreeze: 2097152,
    tfSetDeepFreeze: 4194304,
    tfClearDeepFreeze: 8388608,
  }
  return flagValues[flagName]
}
