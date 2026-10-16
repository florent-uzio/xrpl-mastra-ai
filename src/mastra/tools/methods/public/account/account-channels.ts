import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, paginationMarkerSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod } from '../../shared'

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
