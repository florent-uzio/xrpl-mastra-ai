import { z } from 'zod'
import { xrplAssetAmountSchema, xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * LoanBrokerCoverDeposit-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/loanbrokercoverdeposit#loanbrokercoverdeposit-fields
 */
export const xrplLoanBrokerCoverDepositFieldsSchema = z.object({
  // Required fields
  LoanBrokerID: xrplHash256Schema.describe('ID of the loan broker receiving the first-loss capital.'),
  Amount: xrplAssetAmountSchema.describe(
    "Amount of first-loss capital to deposit. Must be the vault's asset and greater than 0.",
  ),
})

/**
 * Complete LoanBrokerCoverDeposit transaction schema
 */
export const xrplLoanBrokerCoverDepositSchema = xrplCommonFieldsSchema
  .merge(xrplLoanBrokerCoverDepositFieldsSchema)
  .extend({ TransactionType: z.literal('LoanBrokerCoverDeposit') })

export type XrplLoanBrokerCoverDepositFields = z.infer<typeof xrplLoanBrokerCoverDepositFieldsSchema>
export type XrplLoanBrokerCoverDeposit = z.infer<typeof xrplLoanBrokerCoverDepositSchema>
