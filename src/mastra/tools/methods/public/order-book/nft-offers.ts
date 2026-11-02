import { z } from 'zod'
import { ledgerSpecifierShape, paginationMarkerSchema } from '../../../../../helpers'
import { defineMethodTool } from '../../shared'

const nftOffersRequest = z.object({
  nft_id: z.string().length(64).describe('NFTokenID (64 hex characters)'),
  ...ledgerSpecifierShape,
  limit: z.number().int().min(50).max(500).optional().describe('Max offers per page (50-500, default 250)'),
  marker: paginationMarkerSchema,
})

const nftOffersResult = {
  nft_id: z.string().optional(),
  offers: z
    .array(
      z.looseObject({
        nft_offer_index: z.string().describe('Use as NFTokenSellOffer/NFTokenBuyOffer in NFTokenAcceptOffer'),
        owner: z.string().optional(),
        amount: z.unknown().optional(),
        destination: z.string().optional(),
        expiration: z.number().optional(),
      }),
    )
    .optional(),
}

export const getNftBuyOffersTool = defineMethodTool({
  id: 'get-nft-buy-offers',
  command: 'nft_buy_offers',
  description: `List the open buy offers for an NFT. Each offer's nft_offer_index is the ID to accept with NFTokenAcceptOffer.`,
  request: nftOffersRequest,
  result: nftOffersResult,
})

export const getNftSellOffersTool = defineMethodTool({
  id: 'get-nft-sell-offers',
  command: 'nft_sell_offers',
  description: `List the open sell offers for an NFT. Each offer's nft_offer_index is the ID to accept with NFTokenAcceptOffer.`,
  request: nftOffersRequest,
  result: nftOffersResult,
})
