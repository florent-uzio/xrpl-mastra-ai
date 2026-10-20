import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplHash256Schema, xrplHexBlobSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * NFTokenModify-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/nftokenmodify#nftokenmodify-fields
 */
export const xrplNFTokenModifyFieldsSchema = z.object({
  NFTokenID: xrplHash256Schema.describe(
    'The NFTokenID (64 hex characters) of the NFToken to modify. The token must have been minted with the tfMutable flag.',
  ),
  Owner: xrplAddressSchema
    .optional()
    .describe(
      'The account that currently owns the NFToken, if different from the sender. Use it when the issuer (or authorized minter) modifies a token held by another account.',
    ),
  URI: xrplHexBlobSchema(256)
    .nullable()
    .optional()
    .describe(
      'New URI as a hex string (already hex-encoded, not plain text), up to 256 bytes. Cannot be an empty string. Set to null to clear the existing URI. Omit to leave it unchanged.',
    ),
})

/**
 * Complete NFTokenModify transaction schema
 * No transaction flags are defined for this type.
 */
export const xrplNFTokenModifySchema = xrplCommonFieldsSchema
  .merge(xrplNFTokenModifyFieldsSchema)
  .extend({ TransactionType: z.literal('NFTokenModify') })

export type XrplNFTokenModifyFields = z.infer<typeof xrplNFTokenModifyFieldsSchema>
export type XrplNFTokenModify = z.infer<typeof xrplNFTokenModifySchema>
