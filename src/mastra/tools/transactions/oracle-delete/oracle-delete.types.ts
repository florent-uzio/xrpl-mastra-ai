import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * OracleDelete-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/oracledelete#oracledelete-fields
 */
export const xrplOracleDeleteFieldsSchema = z.object({
  OracleDocumentID: z
    .number()
    .int()
    .gte(0)
    .describe(
      'The unique identifier (uint32) of the Oracle to delete, as set when it was created. Must be owned by Account.',
    ),
})

/**
 * Complete OracleDelete transaction schema (requires the PriceOracle amendment)
 */
export const xrplOracleDeleteSchema = xrplCommonFieldsSchema
  .merge(xrplOracleDeleteFieldsSchema)
  .extend({ TransactionType: z.literal('OracleDelete') })

export type XrplOracleDeleteFields = z.infer<typeof xrplOracleDeleteFieldsSchema>
export type XrplOracleDelete = z.infer<typeof xrplOracleDeleteSchema>
