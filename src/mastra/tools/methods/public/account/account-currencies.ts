import { createTool } from '@mastra/core/tools'
import { AccountCurrenciesRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getAccountCurrenciesTool = createTool({
  id: 'get-account-currencies',
  description: `List currency codes an account can send or receive, derived from its trust lines. Approximate: it ignores freezes and authorization.

Request parameters:
- account: address (required)
- ledger_index: number or "validated" | "current" (optional)
- ledger_hash: string (optional)`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<AccountCurrenciesRequest>(),
  }),
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the account_currencies command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_currencies' },
      logMessage: 'Account currencies request',
      mastra,
    })
  },
})
