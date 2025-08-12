import { z } from 'zod'
import { xrplCurrencyAmountSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * Clawback-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/clawback#clawback-fields
 */
export const xrplClawbackFieldsSchema = z.object({
  // Required field
  Amount: xrplCurrencyAmountSchema.describe(
    "The amount being clawed back and the counterparty from which it is being clawed back. The issuer field represents the token holder's account ID, not the issuer's. The value must not be zero.",
  ),

  // Optional field (requires MPTokensV1 amendment)
  Holder: z
    .string()
    .optional()
    .describe(
      "Specifies the holder's address from which to claw back. The holder must already own an MPToken object with a non-zero balance. Requires the MPTokensV1 amendment.",
    ),
})

/**
 * Complete Clawback transaction schema
 */
export const xrplClawbackSchema = xrplCommonFieldsSchema
  .merge(xrplClawbackFieldsSchema)
  .extend({ TransactionType: z.literal('Clawback') })
//   .refine(
//     data => {
//       // Validate that the amount value is not zero
//       const amountValue = parseFloat(data.Amount.value)
//       return amountValue > 0
//     },
//     {
//       message: 'Amount value must be greater than zero',
//       path: ['Amount', 'value'],
//     },
//   )
//   .refine(
//     data => {
//       // Validate that the currency is not XRP (clawback only works with issued tokens)
//       if (data.Amount.currency.toUpperCase() === 'XRP') {
//         return false
//       }
//       return true
//     },
//     {
//       message: 'Clawback cannot be used with XRP - only issued tokens can be clawed back',
//       path: ['Amount', 'currency'],
//     },
//   )
//   .refine(
//     data => {
//       // Validate that the issuer (holder) is not the same as the Account (issuer)
//       if (data.Amount.issuer === data.Account) {
//         return false
//       }
//       return true
//     },
//     {
//       message: 'Cannot claw back from yourself - the holder (issuer field) cannot be the same as the Account',
//       path: ['Amount', 'issuer'],
//     },
//   )

export type XrplClawbackFields = z.infer<typeof xrplClawbackFieldsSchema>
export type XrplClawback = z.infer<typeof xrplClawbackSchema>
