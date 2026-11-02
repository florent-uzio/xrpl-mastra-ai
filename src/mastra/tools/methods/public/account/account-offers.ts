import { z } from 'zod'
import { ledgerSpecifierShape, paginationMarkerSchema, xrplAddressSchema } from '../../../../../helpers'
import { defineMethodTool } from '../../shared'

export const getAccountOffersTool = defineMethodTool({
  id: 'get-account-offers',
  command: 'account_offers',
  description: `List an account's outstanding DEX offers (taker_gets, taker_pays, quality, seq, expiration).

An offer's seq is the OfferSequence to use with OfferCancel.`,
  request: z.object({
    account: xrplAddressSchema.describe('Account address'),
    ...ledgerSpecifierShape,
    limit: z.number().int().min(10).max(400).optional().describe('Max results per page (10-400, default 200).'),
    marker: paginationMarkerSchema,
  }),
  result: {
    account: z.string().optional(),
    offers: z
      .array(
        z.looseObject({
          seq: z.number().describe('Use as OfferSequence with OfferCancel'),
          taker_gets: z.unknown(),
          taker_pays: z.unknown(),
          quality: z.string(),
          expiration: z.number().optional(),
        }),
      )
      .optional(),
  },
})
