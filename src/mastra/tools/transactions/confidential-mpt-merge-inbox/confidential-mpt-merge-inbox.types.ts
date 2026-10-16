import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * ConfidentialMPTMergeInbox-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/confidentialmptmergeinbox
 */
export const xrplConfidentialMPTMergeInboxFieldsSchema = z.object({
  MPTokenIssuanceID: z.string().describe('Hex ID of the MPT issuance'),
})

export const xrplConfidentialMPTMergeInboxSchema = xrplCommonFieldsSchema
  .merge(xrplConfidentialMPTMergeInboxFieldsSchema)
  .extend({ TransactionType: z.literal('ConfidentialMPTMergeInbox') })

export type XrplConfidentialMPTMergeInboxFields = z.infer<typeof xrplConfidentialMPTMergeInboxFieldsSchema>
export type XrplConfidentialMPTMergeInbox = z.infer<typeof xrplConfidentialMPTMergeInboxSchema>
