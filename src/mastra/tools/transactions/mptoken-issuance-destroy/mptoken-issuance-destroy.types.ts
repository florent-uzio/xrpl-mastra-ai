import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * MPTokenIssuanceDestroy-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuancedestroy
 */
export const xrplMPTokenIssuanceDestroyFieldsSchema = z.object({
  MPTokenIssuanceID: z.string().describe('Hex ID of the MPT issuance to delete'),
})

export const xrplMPTokenIssuanceDestroySchema = xrplCommonFieldsSchema
  .merge(xrplMPTokenIssuanceDestroyFieldsSchema)
  .extend({ TransactionType: z.literal('MPTokenIssuanceDestroy') })

export type XrplMPTokenIssuanceDestroyFields = z.infer<typeof xrplMPTokenIssuanceDestroyFieldsSchema>
export type XrplMPTokenIssuanceDestroy = z.infer<typeof xrplMPTokenIssuanceDestroySchema>
