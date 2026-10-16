import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * ConfidentialMPTClawback-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/confidentialmptclawback
 */
export const xrplConfidentialMPTClawbackFieldsSchema = z.object({
  MPTokenIssuanceID: z.string().describe('Hex ID of the MPT issuance'),
  Holder: xrplAddressSchema.describe('Holder (r-address) whose entire confidential balance is clawed back'),
  MPTAmount: z.string().describe('Plaintext total to claw back (integer string, > 0)'),
  ZKProof: z.string().describe('64-byte compact Clawback sigma proof (hex)'),
})

export const xrplConfidentialMPTClawbackSchema = xrplCommonFieldsSchema
  .merge(xrplConfidentialMPTClawbackFieldsSchema)
  .extend({ TransactionType: z.literal('ConfidentialMPTClawback') })

export type XrplConfidentialMPTClawbackFields = z.infer<typeof xrplConfidentialMPTClawbackFieldsSchema>
export type XrplConfidentialMPTClawback = z.infer<typeof xrplConfidentialMPTClawbackSchema>
