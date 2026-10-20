import { z } from 'zod'
import { xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * NFTokenCancelOffer-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/nftokencanceloffer#nftokencanceloffer-fields
 */
export const xrplNFTokenCancelOfferFieldsSchema = z.object({
  NFTokenOffers: z
    .array(xrplHash256Schema)
    .min(1)
    .describe(
      'Non-empty array of NFTokenOffer ledger object IDs (64 hex characters each) to cancel. Offers can be cancelled by their creator, by the destination, or by anyone if the offer has expired or the token no longer exists (e.g. burned). Cancelling a non-existent offer is not an error.',
    ),
})

/**
 * Complete NFTokenCancelOffer transaction schema
 * No transaction flags are defined for this type.
 */
export const xrplNFTokenCancelOfferSchema = xrplCommonFieldsSchema
  .merge(xrplNFTokenCancelOfferFieldsSchema)
  .extend({ TransactionType: z.literal('NFTokenCancelOffer') })

export type XrplNFTokenCancelOfferFields = z.infer<typeof xrplNFTokenCancelOfferFieldsSchema>
export type XrplNFTokenCancelOffer = z.infer<typeof xrplNFTokenCancelOfferSchema>
