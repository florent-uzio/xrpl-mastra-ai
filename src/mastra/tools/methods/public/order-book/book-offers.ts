import { z } from 'zod'
import { ledgerSpecifierShape, xrplAddressSchema } from '../../../../../helpers'
import { xrplAssetSchema } from '../../../transactions/shared'
import { defineMethodTool } from '../../shared'

export const getBookOffersTool = defineMethodTool({
  id: 'get-book-offers',
  command: 'book_offers',
  description: `List the DEX offers of an order book, best price first. taker_gets is what the offer taker would receive (the offer creator sells it); taker_pays is what the taker would pay. Assets are { currency: "XRP" }, { currency, issuer } or { mpt_issuance_id }; non-3-character currency codes are converted to hex automatically.`,
  request: z.object({
    taker_gets: xrplAssetSchema.describe('Asset the taker would receive'),
    taker_pays: xrplAssetSchema.describe('Asset the taker would pay'),
    taker: xrplAddressSchema.optional().describe('Account viewing the book (affects funding of offers)'),
    limit: z.number().int().positive().optional().describe('Max offers to return (default 60)'),
    ...ledgerSpecifierShape,
  }),
  result: {
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
  },
})
