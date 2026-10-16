import { z } from 'zod'
import { xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * LoanDelete-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/loandelete#loandelete-fields
 */
export const xrplLoanDeleteFieldsSchema = z.object({
  // Required field
  LoanID: xrplHash256Schema.describe('ID of the loan to delete.'),
})

/**
 * Complete LoanDelete transaction schema
 */
export const xrplLoanDeleteSchema = xrplCommonFieldsSchema
  .merge(xrplLoanDeleteFieldsSchema)
  .extend({ TransactionType: z.literal('LoanDelete') })

export type XrplLoanDeleteFields = z.infer<typeof xrplLoanDeleteFieldsSchema>
export type XrplLoanDelete = z.infer<typeof xrplLoanDeleteSchema>
