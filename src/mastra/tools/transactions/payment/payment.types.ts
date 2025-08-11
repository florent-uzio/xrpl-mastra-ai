import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

// XRPL Payment Transaction Fields schema
// Reference: https://xrpl.org/docs/references/protocol/transactions/types/payment

// Currency Amount: XRP in drops as string OR Issued currency object
export const xrplCurrencyAmountSchema = z.union([
  // XRP in drops
  z.string().describe('XRP amount in drops (string, e.g., "1000000" for 1 XRP)'),
  // Issued currency
  z
    .object({
      currency: z.string().describe('Currency code (3-char ISO or 160-bit hex)'),
      value: z.string().describe('Amount value as a decimal string'),
      issuer: z.string().describe('Issuer account address'),
    })
    .describe('Issued currency amount'),
])

// MPT Amount (requires MPTokensV1 amendment)
export const xrplMptAmountSchema = z
  .object({
    mpt_issuance_id: z.string().describe('Hex string identifying the MPT issuance'),
    value: z.string().describe('Amount value as a decimal string'),
  })
  .describe('Multi-Purpose Token (MPT) amount')

// Amount-like fields can be CurrencyAmount OR MPT amount
export const xrplAnyAmountSchema = z.union([xrplCurrencyAmountSchema, xrplMptAmountSchema])

// Payment path step (account, currency, issuer)
export const xrplPathStepSchema = z.object({
  account: z.string().optional().describe('Intermediary account in the path'),
  currency: z.string().optional().describe('Currency code for a step'),
  issuer: z.string().optional().describe('Issuer account for a step'),
})

// Path set: array of path arrays
export const xrplPathSetSchema = z
  .array(z.array(xrplPathStepSchema))
  .describe('Array of payment paths (each path is an array of path steps)')

// Payment-specific fields (to be merged with common fields)
export const xrplPaymentFieldsSchema = z.object({
  // API v1: Amount required (alias to DeliverMax). API v2: DeliverMax required.
  Amount: xrplAnyAmountSchema.describe('Alias to DeliverMax (API v1)'),
  DeliverMax: xrplAnyAmountSchema.describe('API v2: Maximum amount to deliver (required in API v2)'),

  DeliverMin: xrplAnyAmountSchema
    .optional()
    .describe('Minimum amount destination should receive (only for partial payments)'),

  Destination: z.string().describe('The account receiving the payment (r-address)'),

  DestinationTag: z.number().optional().describe('Arbitrary tag identifying the reason/recipient'),

  DomainID: z.string().optional().describe('Permissioned domain ID for cross-currency payments'),

  InvoiceID: z.string().optional().describe('Arbitrary 256-bit hex value identifying this payment'),

  Paths: xrplPathSetSchema.optional().describe('Payment paths (omit for direct/XRP payments)'),

  SendMax: xrplAnyAmountSchema.optional().describe('Maximum amount to spend (source currency)'),

  CredentialIDs: z.array(z.string()).optional().describe('Ledger entry IDs of Credential entries to authorize deposit'),
})

export const xrplPaymentSchema = xrplCommonFieldsSchema
  .merge(xrplPaymentFieldsSchema)
  .extend({ TransactionType: z.literal('Payment') })

export type XrplPaymentFields = z.infer<typeof xrplPaymentFieldsSchema>
export type XrplPayment = z.infer<typeof xrplPaymentSchema>
