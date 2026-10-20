import { createTool } from '@mastra/core/tools'
import { Request } from 'xrpl'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, xrplAddressSchema } from '../../../../../helpers'
import { encodeCurrencyCodes, xrplAssetSchema } from '../../../transactions/shared'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getBookOffersTool = createTool({
  id: 'get-book-offers',
  description: `List the DEX offers of an order book, best price first. taker_gets is what the offer taker would receive (the offer creator sells it); taker_pays is what the taker would pay. Assets are { currency: "XRP" }, { currency, issuer } or { mpt_issuance_id }; non-3-character currency codes are converted to hex automatically.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      taker_gets: xrplAssetSchema.describe('Asset the taker would receive'),
      taker_pays: xrplAssetSchema.describe('Asset the taker would pay'),
      taker: xrplAddressSchema.optional().describe('Account viewing the book (affects funding of offers)'),
      limit: z.number().int().positive().optional().describe('Max offers to return (default 60)'),
      ...ledgerSpecifierShape,
    }),
  }),
  outputSchema: xrplMethodResponse({
    offers: z
      .array(
        z.looseObject({
          Account: z.string().optional(),
          Sequence: z.number().optional(),
          TakerGets: z.unknown().optional(),
          TakerPays: z.unknown().optional(),
          quality: z.string().optional().describe('TakerPays / TakerGets price'),
          owner_funds: z.string().optional(),
        }),
      )
      .optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: {
        ...request,
        taker_gets: encodeCurrencyCodes(request.taker_gets),
        taker_pays: encodeCurrencyCodes(request.taker_pays),
        command: 'book_offers',
      } as Request,
      logMessage: 'Book offers request',
      mastra,
    })
  },
})
