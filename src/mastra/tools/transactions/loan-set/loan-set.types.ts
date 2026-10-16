import { z } from 'zod'
import { xrplAddressSchema, xrplDecimalValueSchema } from '../../../../helpers'
import { xrplHash256Schema, xrplHexBlobSchema } from '../shared'
import { xrplCommonFieldsSchema, xrplSignersSchema } from '../shared/common-fields'

const rateSchema = z.number().int().min(0).max(100000)

/**
 * LoanSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/loanset#loanset-fields
 */
export const xrplLoanSetFieldsSchema = z.object({
  // Required fields
  LoanBrokerID: xrplHash256Schema.describe('ID of the loan broker that issues the loan.'),
  PrincipalRequested: xrplDecimalValueSchema.describe(
    'Principal amount requested by the borrower, in the vault asset.',
  ),

  // Optional fields
  Counterparty: xrplAddressSchema
    .optional()
    .describe('The other party of the loan: the borrower if the Account is the broker owner, and vice versa.'),
  CounterpartySignature: z
    .object({
      SigningPubKey: z.string().optional().describe('Hex public key verifying TxnSignature'),
      TxnSignature: z
        .string()
        .optional()
        .describe('Hex counterparty signature (made with the LoanSet counterparty signing prefix)'),
      Signers: xrplSignersSchema.optional(),
    })
    .optional()
    .describe("The counterparty's signature. Required unless the transaction is inside a Batch."),
  Data: xrplHexBlobSchema(256).optional().describe('Hex-encoded metadata, up to 256 bytes.'),
  LoanOriginationFee: xrplDecimalValueSchema
    .optional()
    .describe('Fee paid to the broker owner when the loan is created.'),
  LoanServiceFee: xrplDecimalValueSchema.optional().describe('Fee paid to the broker owner with each payment.'),
  LatePaymentFee: xrplDecimalValueSchema.optional().describe('Fee paid to the broker owner for a late payment.'),
  ClosePaymentFee: xrplDecimalValueSchema
    .optional()
    .describe('Fee paid to the broker owner for an early full repayment.'),
  OverpaymentFee: rateSchema
    .optional()
    .describe('Fee on overpayments, in 1/10 basis points (1 = 0.001%). 0 to 100000.'),
  InterestRate: rateSchema.optional().describe('Annualized interest rate, in 1/10 basis points. 0 to 100000.'),
  LateInterestRate: rateSchema
    .optional()
    .describe('Premium added to the interest rate for late payments, in 1/10 basis points. 0 to 100000.'),
  CloseInterestRate: rateSchema
    .optional()
    .describe('Interest rate applied to an early full repayment, in 1/10 basis points. 0 to 100000.'),
  OverpaymentInterestRate: rateSchema
    .optional()
    .describe('Interest rate on overpayments, in 1/10 basis points. 0 to 100000.'),
  PaymentTotal: z.number().int().gte(0).optional().describe('Total number of payments.'),
  PaymentInterval: z.number().int().gte(0).optional().describe('Seconds between payments.'),
  GracePeriod: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe('Seconds after a due date before the loan can be defaulted. At least 60 and at most PaymentInterval.'),
})

/**
 * Complete LoanSet transaction schema
 */
export const xrplLoanSetSchema = xrplCommonFieldsSchema
  .merge(xrplLoanSetFieldsSchema)
  .extend({ TransactionType: z.literal('LoanSet') })

export type XrplLoanSetFields = z.infer<typeof xrplLoanSetFieldsSchema>
export type XrplLoanSet = z.infer<typeof xrplLoanSetSchema>
