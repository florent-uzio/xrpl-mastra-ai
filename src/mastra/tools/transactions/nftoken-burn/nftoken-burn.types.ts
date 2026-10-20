import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * NFTokenBurn-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/nftokenburn#nftokenburn-fields
 */
export const xrplNFTokenBurnFieldsSchema = z.object({
  NFTokenID: xrplHash256Schema.describe('The NFTokenID (64 hex characters) of the NFToken to burn.'),
  Owner: xrplAddressSchema
    .optional()
    .describe(
      'The owner of the NFToken to burn. Only used if the sender is the issuer (or an authorized minter) burning a token owned by another account (requires the token to have been minted with tfBurnable). Omit if the sender owns the token.',
    ),
})

/**
 * Complete NFTokenBurn transaction schema
 * No transaction flags are defined for this type.
 */
export const xrplNFTokenBurnSchema = xrplCommonFieldsSchema
  .merge(xrplNFTokenBurnFieldsSchema)
  .extend({ TransactionType: z.literal('NFTokenBurn') })

export type XrplNFTokenBurnFields = z.infer<typeof xrplNFTokenBurnFieldsSchema>
export type XrplNFTokenBurn = z.infer<typeof xrplNFTokenBurnSchema>
