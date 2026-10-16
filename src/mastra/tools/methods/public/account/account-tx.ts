import { createTool } from '@mastra/core/tools'
import { AccountTxRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getAccountTxTool = createTool({
  id: 'get-account-tx',
  description: `Get validated transaction history for an account.

Request parameters:
- account: address (required)
- tx_type: only this transaction type, e.g. "Payment" (optional, Clio servers only)
- ledger_index_min / ledger_index_max: ledger range, -1 for earliest/latest available (optional)
- ledger_index or ledger_hash: a single ledger only. Do not combine with ledger_index_min/max (optional)
- binary: boolean, hex instead of JSON (optional)
- forward: boolean, oldest first (optional)
- limit: number, the server may ignore it (optional)
- marker: pagination marker from a previous response (optional)`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<AccountTxRequest>(),
  }),
  execute: async (inputData, { mastra }) => {
    // Extract network and options from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the account_tx command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_tx' },
      logMessage: 'Account Tx request',
      mastra,
    })
  },
})
