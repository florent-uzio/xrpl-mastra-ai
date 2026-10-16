import { z } from 'zod'
import { xrplCurrencyAmountSchema, xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * LoanBrokerCoverClawback-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/loanbrokercoverclawback#loanbrokercoverclawback-fields
 */
export const xrplLoanBrokerCoverClawbackFieldsSchema = z.object({
  // Optional fields (at least one of them is required)
  LoanBrokerID: xrplHash256Schema
    .optional()
    .describe('ID of the loan broker. Required if Amount is an MPT, or a token whose issuer is the Account.'),
  Amount: z
    .union([
      xrplCurrencyAmountSchema,
      z.object({
        mpt_issuance_id: z.string().describe('MPT issuance ID (48 hex characters)'),
        value: z.string().describe('Quoted integer amount'),
      }),
    ])
    .optional()
    .describe(
      'Amount of first-loss capital to claw back. If 0 or omitted, claws back down to the minimum cover. XRP is not allowed.',
    ),
})

/**
 * Complete LoanBrokerCoverClawback transaction schema
 */
export const xrplLoanBrokerCoverClawbackSchema = xrplCommonFieldsSchema
  .merge(xrplLoanBrokerCoverClawbackFieldsSchema)
  .extend({ TransactionType: z.literal('LoanBrokerCoverClawback') })

export type XrplLoanBrokerCoverClawbackFields = z.infer<typeof xrplLoanBrokerCoverClawbackFieldsSchema>
export type XrplLoanBrokerCoverClawback = z.infer<typeof xrplLoanBrokerCoverClawbackSchema>
