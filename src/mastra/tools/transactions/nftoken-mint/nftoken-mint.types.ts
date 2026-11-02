import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCurrencyAmountSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * NFTokenMint-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/nftokenmint#nftokenmint-fields
 */
export const xrplNFTokenMintFieldsSchema = z.object({
  // Required field
  NFTokenTaxon: z
    .number()
    .int()
    .gte(0)
    .default(0)
    .describe(
      'Defaults to 0. An arbitrary taxon, or shared identifier, for a series or collection of related NFTs. To mint a series of NFTs, give them all the same taxon.',
    ),

  // Optional fields
  Issuer: xrplAddressSchema
    .optional()
    .describe(
      'The issuer of the token, if the sender is issuing it on behalf of another account. Must be omitted if the sender is the issuer. If provided, the issuer must have NFTokenMinter set to the sender.',
    ),
  TransferFee: z
    .number()
    .int()
    .min(0)
    .max(50000)
    .optional()
    .describe(
      'Fee charged by the issuer for secondary sales of the NFToken. Valid range: 0-50000 (0.00% to 50.00% in 0.001% increments). Requires tfTransferable flag if provided.',
    ),
  URI: z
    .string()
    .refine(uri => Buffer.byteLength(uri) <= 256, 'URI must be 256 bytes or less')
    .optional()
    .describe(
      'Plain-text URI (hex-encoded automatically), up to 256 bytes. Typically points to NFT metadata (HTTPS, IPFS, magnet link, data URL, etc.).',
    ),
  Amount: z
    .union([z.string(), xrplCurrencyAmountSchema])
    .optional()
    .describe(
      'Amount expected or offered for the NFToken. Must be non-zero except for XRP (where zero means giving away for free).',
    ),
  Expiration: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe(
      'Time after which the offer is no longer active, in seconds since the Ripple Epoch. Requires Amount field to be specified.',
    ),
  Destination: xrplAddressSchema
    .optional()
    .describe(
      'If present, indicates that this offer may only be accepted by the specified account. Requires Amount field to be specified.',
    ),
})

/**
 * Complete NFTokenMint transaction schema
 */
export const xrplNFTokenMintSchema = xrplCommonFieldsSchema
  .merge(xrplNFTokenMintFieldsSchema)
  .extend({ TransactionType: z.literal('NFTokenMint') })

export type XrplNFTokenMintFields = z.infer<typeof xrplNFTokenMintFieldsSchema>
export type XrplNFTokenMint = z.infer<typeof xrplNFTokenMintSchema>
