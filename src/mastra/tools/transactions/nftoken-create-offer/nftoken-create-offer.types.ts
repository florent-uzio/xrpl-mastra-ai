import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCurrencyAmountSchema, xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/** XRP in drops (string) or a trust line token. xrpl.js does not support MPT amounts for NFT offers. */
const xrplNftAmountSchema = z.union([
  z.string().describe('XRP amount in drops, e.g. "1000000" = 1 XRP'),
  xrplCurrencyAmountSchema,
])

/**
 * NFTokenCreateOffer flags
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/nftokencreateoffer#nftokencreateoffer-flags
 */
export const NFTokenCreateOfferFlagsSchema = z.enum([
  'tfSellNFToken', // 1 - The offer is a sell offer. If unset, it is a buy offer.
])

export type NFTokenCreateOfferFlags = z.infer<typeof NFTokenCreateOfferFlagsSchema>

/**
 * NFTokenCreateOffer-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/nftokencreateoffer#nftokencreateoffer-fields
 */
export const xrplNFTokenCreateOfferFieldsSchema = z.object({
  NFTokenID: xrplHash256Schema.describe('The NFTokenID (64 hex characters) of the NFToken to buy or sell.'),
  Amount: xrplNftAmountSchema.describe(
    'Amount expected or offered for the NFToken. XRP is a string of drops; tokens are {currency, issuer, value}. Must be greater than 0 for buy offers. For sell offers, 0 XRP means giving the NFT away (to the Destination, if set). If the NFT has tfOnlyXRP set, only XRP is allowed.',
  ),
  Owner: xrplAddressSchema
    .optional()
    .describe(
      'The current owner of the NFToken. Required for buy offers (tfSellNFToken not set). Must be omitted for sell offers. Must not equal Account.',
    ),
  Expiration: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe('Time after which the offer is no longer active, in seconds since the Ripple Epoch (2000-01-01).'),
  Destination: xrplAddressSchema
    .optional()
    .describe(
      'If present, only this account may accept the offer (or broker it). Must not equal Account. The destination can also cancel the offer.',
    ),
})

/**
 * Complete NFTokenCreateOffer transaction schema
 */
export const xrplNFTokenCreateOfferSchema = xrplCommonFieldsSchema
  .merge(xrplNFTokenCreateOfferFieldsSchema)
  .extend({ TransactionType: z.literal('NFTokenCreateOffer') })

export type XrplNFTokenCreateOfferFields = z.infer<typeof xrplNFTokenCreateOfferFieldsSchema>
export type XrplNFTokenCreateOffer = z.infer<typeof xrplNFTokenCreateOfferSchema>
