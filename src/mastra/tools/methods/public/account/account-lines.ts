import { createTool } from '@mastra/core/tools'
import { AccountLinesRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getAccountLinesTool = createTool({
  id: 'get-account-lines',
  description: `Get an account's trust lines (token balances and limits).

Request parameters:
- account: address (required)
- peer: only lines with this counterparty address (optional)
- ledger_index: number or "validated" | "current" (optional)
- ledger_hash: string (optional)
- limit: 10-400, default 200 (optional)
- marker: pagination marker from a previous response (optional)

Each line has balance (positive: the account holds tokens; negative: the account owes them), limit, limit_peer, and freeze/auth/no_ripple flags.`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<AccountLinesRequest>(),
  }),
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the account_lines command
    return await executeMethod({
      network,
      request: {
        ...request,
        command: 'account_lines',
      },
      logMessage: 'Account lines request',
      mastra,
    })
  },
})
