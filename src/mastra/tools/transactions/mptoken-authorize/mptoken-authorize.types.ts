import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * MPTokenAuthorize-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/mptokenauthorize
 */
export const xrplMPTokenAuthorizeFieldsSchema = z.object({
  MPTokenIssuanceID: z.string().describe('Hex ID of the MPT issuance (returned by MPTokenIssuanceCreate)'),
  Holder: xrplAddressSchema
    .optional()
    .describe('Issuer only: the holder (r-address) to authorize or unauthorize. Omit when the sender is the holder'),
})

export const xrplMPTokenAuthorizeSchema = xrplCommonFieldsSchema
  .merge(xrplMPTokenAuthorizeFieldsSchema)
  .extend({ TransactionType: z.literal('MPTokenAuthorize') })

export type XrplMPTokenAuthorizeFields = z.infer<typeof xrplMPTokenAuthorizeFieldsSchema>
export type XrplMPTokenAuthorize = z.infer<typeof xrplMPTokenAuthorizeSchema>
