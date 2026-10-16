import { z } from 'zod'
import { xrplAssetAmountSchema, xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * LoanPay flags (set at most one in Flags)
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/loanpay#loanpay-flags
 */
export const LoanPayFlagsSchema = z.enum([
  'tfLoanOverpayment', // 65536 - Treat the remaining amount as an overpayment
  'tfLoanFullPayment', // 131072 - Early full repayment
  'tfLoanLatePayment', // 262144 - Late payment
])

export type LoanPayFlags = z.infer<typeof LoanPayFlagsSchema>

/**
 * LoanPay-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/loanpay#loanpay-fields
 */
export const xrplLoanPayFieldsSchema = z.object({
  // Required fields
  LoanID: xrplHash256Schema.describe('ID of the loan to repay.'),
  Amount: xrplAssetAmountSchema.describe("Amount to pay, in the loan's asset. Must be positive."),
})

/**
 * Complete LoanPay transaction schema
 */
export const xrplLoanPaySchema = xrplCommonFieldsSchema
  .merge(xrplLoanPayFieldsSchema)
  .extend({ TransactionType: z.literal('LoanPay') })

export type XrplLoanPayFields = z.infer<typeof xrplLoanPayFieldsSchema>
export type XrplLoanPay = z.infer<typeof xrplLoanPaySchema>
