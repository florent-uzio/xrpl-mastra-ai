import { z } from 'zod'
import { xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * LoanManage flags (set exactly one in Flags)
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/loanmanage#loanmanage-flags
 */
export const LoanManageFlagsSchema = z.enum([
  'tfLoanDefault', // 65536 - Default the loan
  'tfLoanImpair', // 131072 - Mark the loan as impaired
  'tfLoanUnimpair', // 262144 - Remove the impaired status
])

export type LoanManageFlags = z.infer<typeof LoanManageFlagsSchema>

/**
 * LoanManage-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/loanmanage#loanmanage-fields
 */
export const xrplLoanManageFieldsSchema = z.object({
  // Required field
  LoanID: xrplHash256Schema.describe('ID of the loan to manage.'),
})

/**
 * Complete LoanManage transaction schema
 */
export const xrplLoanManageSchema = xrplCommonFieldsSchema
  .merge(xrplLoanManageFieldsSchema)
  .extend({ TransactionType: z.literal('LoanManage') })

export type XrplLoanManageFields = z.infer<typeof xrplLoanManageFieldsSchema>
export type XrplLoanManage = z.infer<typeof xrplLoanManageSchema>
