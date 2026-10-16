import { createTool } from '@mastra/core/tools'
import { AccountChannelsRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getAccountChannelsTool = createTool({
  id: 'get-account-channels',
  description: `List Payment Channels where the account is the source (not the destination).

Request parameters:
- account: source address (required)
- destination_account: only channels to this address (optional)
- ledger_index: number or "validated" | "current" (optional)
- ledger_hash: string (optional)
- limit: 10-400, default 200 (optional)
- marker: pagination marker from a previous response (optional)

Funds left in a channel = amount - balance.`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<AccountChannelsRequest>(),
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
