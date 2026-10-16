import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, paginationMarkerSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getAccountChannelsTool = createTool({
  id: 'get-account-channels',
  description: `List Payment Channels where the account is the source (not the destination).

Funds left in a channel = amount - balance.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      account: xrplAddressSchema.describe('Source account address'),
      destination_account: xrplAddressSchema.optional().describe('Only channels to this address'),
      ...ledgerSpecifierShape,
      limit: z.number().int().min(10).max(400).optional().describe('Max results per page (10-400, default 200).'),
      marker: paginationMarkerSchema,
    }),
  }),
  outputSchema: xrplMethodResponse({
    account: z.string().optional(),
    channels: z
      .array(
        z.looseObject({
          channel_id: z.string(),
          destination_account: z.string(),
          amount: z.string().describe('Total drops allocated to the channel'),
          balance: z.string().describe('Drops already paid out; funds left = amount - balance'),
        }),
      )
      .optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the account_channels command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_channels' },
      logMessage: 'Account channels request',
      mastra,
    })
  },
})
