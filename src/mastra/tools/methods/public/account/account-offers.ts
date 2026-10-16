import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, paginationMarkerSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getAccountOffersTool = createTool({
  id: 'get-account-offers',
  description: `List an account's outstanding DEX offers (taker_gets, taker_pays, quality, seq, expiration).

An offer's seq is the OfferSequence to use with OfferCancel.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      account: xrplAddressSchema.describe('Account address'),
      ...ledgerSpecifierShape,
      limit: z.number().int().min(10).max(400).optional().describe('Max results per page (10-400, default 200).'),
      marker: paginationMarkerSchema,
    }),
  }),
  outputSchema: xrplMethodResponse({
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
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the account_offers command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_offers' },
      logMessage: 'Account offers request',
      mastra,
    })
  },
})
