import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, paginationMarkerSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

const nftOffersInput = z.object({
  network: networkSchema,
  request: z.object({
    nft_id: z.string().length(64).describe('NFTokenID (64 hex characters)'),
    ...ledgerSpecifierShape,
    limit: z.number().int().min(50).max(500).optional().describe('Max offers per page (50-500, default 250)'),
    marker: paginationMarkerSchema,
  }),
})

const nftOffersOutput = xrplMethodResponse({
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
})

export const getNftBuyOffersTool = createTool({
  id: 'get-nft-buy-offers',
  description: `List the open buy offers for an NFT. Each offer's nft_offer_index is the ID to accept with NFTokenAcceptOffer.`,
  inputSchema: nftOffersInput,
  outputSchema: nftOffersOutput,
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'nft_buy_offers' },
      logMessage: 'NFT buy offers request',
      mastra,
    })
  },
})

export const getNftSellOffersTool = createTool({
  id: 'get-nft-sell-offers',
  description: `List the open sell offers for an NFT. Each offer's nft_offer_index is the ID to accept with NFTokenAcceptOffer.`,
  inputSchema: nftOffersInput,
  outputSchema: nftOffersOutput,
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'nft_sell_offers' },
      logMessage: 'NFT sell offers request',
      mastra,
    })
  },
})
