import { z } from 'zod'
import { xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * MPTokenIssuanceCreate-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuancecreate
 */
export const xrplMPTokenIssuanceCreateFieldsSchema = z.object({
  AssetScale: z.number().int().min(0).max(255).optional().describe('Decimal places (default 0: indivisible)'),
  MaximumAmount: z.string().optional().describe('Max supply, base-10 integer string, 1 to 2^63-1 (default 2^63-1)'),
  TransferFee: z.number().int().min(0).max(50000).optional().describe('0-50000 (0.001% units). Needs tfMPTCanTransfer'),
  MPTokenMetadata: z.string().optional().describe('Hex, 1-1024 bytes (XLS-89 JSON)'),
  DomainID: xrplHash256Schema.optional().describe('Permissioned domain ID. Needs tfMPTRequireAuth'),
  ImmutableFlags: z.number().optional().describe('Sum of tif* values making fields/flags permanent. Needs DynamicMPT'),
})

export const xrplMPTokenIssuanceCreateSchema = xrplCommonFieldsSchema
  .merge(xrplMPTokenIssuanceCreateFieldsSchema)
  .extend({ TransactionType: z.literal('MPTokenIssuanceCreate') })

export type XrplMPTokenIssuanceCreateFields = z.infer<typeof xrplMPTokenIssuanceCreateFieldsSchema>
export type XrplMPTokenIssuanceCreate = z.infer<typeof xrplMPTokenIssuanceCreateSchema>
