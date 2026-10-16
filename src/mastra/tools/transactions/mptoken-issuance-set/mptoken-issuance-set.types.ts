import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * MPTokenIssuanceSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuanceset
 */
export const xrplMPTokenIssuanceSetFieldsSchema = z.object({
  MPTokenIssuanceID: z.string().describe('Hex ID of the MPT issuance to update'),
  Holder: xrplAddressSchema.optional().describe('Apply to this holder only; omit for all holders. Lock/unlock only'),
  MPTokenMetadata: z.string().optional().describe('Hex; replaces metadata, empty removes it. DynamicMPT'),
  TransferFee: z.number().int().min(0).max(50000).optional().describe('New fee, 0 removes it. DynamicMPT'),
  DomainID: xrplHash256Schema.optional().describe('Permissioned domain ID. Needs RequireAuth. Not with Holder'),
  ImmutableFlags: z.number().optional().describe('Sum of tif* values to make permanent. DynamicMPT'),
  IssuerEncryptionKey: z.string().optional().describe('33-byte EC-ElGamal public key (hex). ConfidentialTransfer'),
  AuditorEncryptionKey: z.string().optional().describe('33-byte auditor key (hex). Requires IssuerEncryptionKey'),
})

export const xrplMPTokenIssuanceSetSchema = xrplCommonFieldsSchema
  .merge(xrplMPTokenIssuanceSetFieldsSchema)
  .extend({ TransactionType: z.literal('MPTokenIssuanceSet') })

export type XrplMPTokenIssuanceSetFields = z.infer<typeof xrplMPTokenIssuanceSetFieldsSchema>
export type XrplMPTokenIssuanceSet = z.infer<typeof xrplMPTokenIssuanceSetSchema>
