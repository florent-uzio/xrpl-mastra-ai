import { createTool } from '@mastra/core/tools'
import { AccountInfoRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getAccountInfoTool = createTool({
  id: 'get-account-info',
  description: `Get an account's XRP balance, sequence, owner count and flags (AccountRoot).

Request parameters:
- account: address (required)
- ledger_index: number or "validated" | "current" (optional)
- ledger_hash: string (optional)
- queue: boolean, optional. Include queued transactions (current ledger only).
- signer_lists: boolean, optional. Include SignerList objects.

Balance is in drops (1 XRP = 1,000,000 drops). Error actNotFound means the account does not exist or is not funded.`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<AccountInfoRequest>(),
  }),
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the account_info command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_info' },
      logMessage: 'Account info request',
      mastra,
    })
  },
})
