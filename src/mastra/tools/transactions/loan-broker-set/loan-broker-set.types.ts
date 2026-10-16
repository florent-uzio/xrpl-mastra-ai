import { z } from 'zod'
import { xrplDecimalValueSchema } from '../../../../helpers'
import { xrplHash256Schema, xrplHexBlobSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * LoanBrokerSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/loanbrokerset#loanbrokerset-fields
 */
export const xrplLoanBrokerSetFieldsSchema = z.object({
  // Required field
  VaultID: xrplHash256Schema.describe(
    'ID of the vault that provides liquidity for the loans. Cannot be changed on an update.',
  ),

  // Optional fields
  LoanBrokerID: xrplHash256Schema
    .optional()
    .describe('ID of an existing loan broker to update. Omit to create a new one.'),
  Data: xrplHexBlobSchema(256).optional().describe('Hex-encoded metadata, up to 256 bytes.'),
  ManagementFeeRate: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .optional()
    .describe('Fee charged on loan interest, in 1/10 basis points (1 = 0.001%). 0 to 10000 (0% to 10%).'),
  DebtMaximum: xrplDecimalValueSchema
    .optional()
    .describe('Maximum amount the broker can owe the vault. Default 0 means no limit.'),
  CoverRateMinimum: z
    .number()
    .int()
    .min(0)
    .max(100000)
    .optional()
    .describe('First-loss capital required as a share of DebtTotal, in 1/10 basis points. 0 to 100000 (0% to 100%).'),
  CoverRateLiquidation: z
    .number()
    .int()
    .min(0)
    .max(100000)
    .optional()
    .describe(
      'Share of the minimum first-loss capital moved to the vault when a loan defaults, in 1/10 basis points. 0 to 100000 (0% to 100%).',
    ),
})

/**
 * Complete LoanBrokerSet transaction schema
 */
export const xrplLoanBrokerSetSchema = xrplCommonFieldsSchema
  .merge(xrplLoanBrokerSetFieldsSchema)
  .extend({ TransactionType: z.literal('LoanBrokerSet') })

export type XrplLoanBrokerSetFields = z.infer<typeof xrplLoanBrokerSetFieldsSchema>
export type XrplLoanBrokerSet = z.infer<typeof xrplLoanBrokerSetSchema>
