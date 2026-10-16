import { createTool } from '@mastra/core/tools'
import { AccountOffersRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getAccountOffersTool = createTool({
  id: 'get-account-offers',
  description: `List an account's outstanding DEX offers (taker_gets, taker_pays, quality, seq, expiration).

Request parameters:
- account: address (required)
- ledger_index: number or "validated" | "current" (optional)
- ledger_hash: string (optional)
- limit: 10-400, default 200 (optional)
- marker: pagination marker from a previous response (optional)

An offer's seq is the OfferSequence to use with OfferCancel.`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<AccountOffersRequest>(),
  }),
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
