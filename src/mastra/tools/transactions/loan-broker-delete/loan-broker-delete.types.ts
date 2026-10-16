import { z } from 'zod'
import { xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * LoanBrokerDelete-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/loanbrokerdelete#loanbrokerdelete-fields
 */
export const xrplLoanBrokerDeleteFieldsSchema = z.object({
  // Required field
  LoanBrokerID: xrplHash256Schema.describe('ID of the loan broker to delete.'),
})

/**
 * Complete LoanBrokerDelete transaction schema
 */
export const xrplLoanBrokerDeleteSchema = xrplCommonFieldsSchema
  .merge(xrplLoanBrokerDeleteFieldsSchema)
  .extend({ TransactionType: z.literal('LoanBrokerDelete') })

export type XrplLoanBrokerDeleteFields = z.infer<typeof xrplLoanBrokerDeleteFieldsSchema>
export type XrplLoanBrokerDelete = z.infer<typeof xrplLoanBrokerDeleteSchema>
