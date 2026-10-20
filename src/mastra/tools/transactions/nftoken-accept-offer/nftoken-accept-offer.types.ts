import { z } from 'zod'
import { xrplCurrencyAmountSchema, xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/** XRP in drops (string) or a trust line token. xrpl.js does not support MPT amounts for NFT offers. */
const xrplNftAmountSchema = z.union([
  z.string().describe('XRP amount in drops, e.g. "1000000" = 1 XRP'),
  xrplCurrencyAmountSchema,
])

/**
 * NFTokenAcceptOffer-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/nftokenacceptoffer#nftokenacceptoffer-fields
 */
export const xrplNFTokenAcceptOfferFieldsSchema = z.object({
  NFTokenSellOffer: xrplHash256Schema
    .optional()
    .describe(
      'ID (64 hex characters) of the NFTokenOffer ledger object that sells the NFToken. Required to accept a sell offer directly or in brokered mode. At least one of NFTokenSellOffer or NFTokenBuyOffer must be set.',
    ),
  NFTokenBuyOffer: xrplHash256Schema
    .optional()
    .describe(
      'ID (64 hex characters) of the NFTokenOffer ledger object that buys the NFToken. Required to accept a buy offer directly or in brokered mode. At least one of NFTokenSellOffer or NFTokenBuyOffer must be set.',
    ),
  NFTokenBrokerFee: xrplNftAmountSchema
    .optional()
    .describe(
      'Brokered mode only (both NFTokenSellOffer and NFTokenBuyOffer set). The amount the broker keeps as a fee. It must be greater than 0 (omit if there is no fee), use the same currency and issuer as the offers, be less than the buy offer amount minus the sell offer amount, and the buy offer amount must be at least the sell offer amount plus this fee. XRP is a string of drops; tokens are {currency, issuer, value}.',
    ),
})

/**
 * Complete NFTokenAcceptOffer transaction schema
 * No transaction flags are defined for this type.
 */
export const xrplNFTokenAcceptOfferSchema = xrplCommonFieldsSchema
  .merge(xrplNFTokenAcceptOfferFieldsSchema)
  .extend({ TransactionType: z.literal('NFTokenAcceptOffer') })

export type XrplNFTokenAcceptOfferFields = z.infer<typeof xrplNFTokenAcceptOfferFieldsSchema>
export type XrplNFTokenAcceptOffer = z.infer<typeof xrplNFTokenAcceptOfferSchema>
