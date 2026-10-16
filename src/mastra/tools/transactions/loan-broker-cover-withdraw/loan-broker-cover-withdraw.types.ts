import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplAssetAmountSchema, xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * LoanBrokerCoverWithdraw-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/loanbrokercoverwithdraw#loanbrokercoverwithdraw-fields
 */
export const xrplLoanBrokerCoverWithdrawFieldsSchema = z.object({
  // Required fields
  LoanBrokerID: xrplHash256Schema.describe('ID of the loan broker to withdraw from.'),
  Amount: xrplAssetAmountSchema.describe(
    "Amount of first-loss capital to withdraw. Must be the vault's asset and greater than 0.",
  ),

  // Optional fields
  Destination: xrplAddressSchema.optional().describe('Account that receives the assets. Defaults to the sender.'),
  DestinationTag: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe('Tag identifying the reason for the withdrawal. Requires Destination.'),
})

/**
 * Complete LoanBrokerCoverWithdraw transaction schema
 */
export const xrplLoanBrokerCoverWithdrawSchema = xrplCommonFieldsSchema
  .merge(xrplLoanBrokerCoverWithdrawFieldsSchema)
  .extend({ TransactionType: z.literal('LoanBrokerCoverWithdraw') })

export type XrplLoanBrokerCoverWithdrawFields = z.infer<typeof xrplLoanBrokerCoverWithdrawFieldsSchema>
export type XrplLoanBrokerCoverWithdraw = z.infer<typeof xrplLoanBrokerCoverWithdrawSchema>
