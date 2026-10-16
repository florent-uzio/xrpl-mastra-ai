import { createTool } from '@mastra/core/tools'
import { GatewayBalancesRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getGatewayBalancesTool = createTool({
  id: 'get-gateway-balances',
  description: `Calculate the total tokens an issuer account has issued (obligations), optionally excluding operational "hot wallet" addresses. Some public servers disable this method.

Request parameters:
- account: issuer address (required)
- hotwallet: address or array of addresses to exclude from obligations (optional)
- ledger_index: number or "validated" | "current" (optional)
- ledger_hash: string (optional)

Response: obligations (issued to non-hotwallet holders), balances (held by the hotwallets), assets (issued by others and held by this account).`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<GatewayBalancesRequest>(),
  }),
  execute: async (inputData, { mastra }) => {
    // Extract network and options from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the gateway_balances command
    return await executeMethod({
      network,
      request: { ...request, command: 'gateway_balances' },
      logMessage: 'Gateway balances request',
      mastra,
    })
  },
})
