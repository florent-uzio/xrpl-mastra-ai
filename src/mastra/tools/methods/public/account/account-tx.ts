import { createTool } from '@mastra/core/tools'
import { AccountTxRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getAccountTxTool = createTool({
  id: 'get-account-tx',
  description: `Get an XRP Ledger account's transaction history. This method retrieves a list of validated transactions that involve a given account.

Request Parameters:
- account: A unique identifier for the account, most commonly the account's address (string, required)
- tx_type: Return only transactions of a specific type, such as "Clawback", "AccountSet", "AccountDelete", etc. (string, optional, case-insensitive, Clio only)
- ledger_index_min: Specify the earliest ledger to include transactions from (integer, optional, -1 for earliest available)
- ledger_index_max: Specify the most recent ledger to include transactions from (integer, optional, -1 for most recent available)
- ledger_hash: Look for transactions from a single ledger only (string, optional)
- ledger_index: Look for transactions from a single ledger only (string or unsigned integer, optional)
- binary: Return transactions as hex strings instead of JSON (boolean, optional, default: false)
- forward: Return values indexed with oldest ledger first if true (boolean, optional, default: false)
- limit: Limit the number of transactions to retrieve (integer, optional, server may not honor this value)
- marker: Value from previous paginated response for resuming (optional)

Note for API v2: If you specify either ledger_index or ledger_hash, including ledger_index_min and ledger_index_max returns an invalidParams error.

The response includes:
- account: Unique address identifying the related account (string)
- ledger_index_min: The ledger index of the earliest ledger actually searched for transactions (integer)
- ledger_index_max: The ledger index of the most recent ledger actually searched for transactions (integer)
- limit: The limit value used in the request (integer)
- marker: Server-defined value for pagination, pass this to the next call to resume (optional)
- transactions: Array of transactions matching the request's criteria, each containing:
  - close_time_iso: The ledger close time in ISO 8601 format (string)
  - hash: The unique hash identifier of the transaction (string)
  - ledger_hash: Hex string of the ledger version that included this transaction (string)
  - ledger_index: The ledger index of the ledger version that included this transaction (integer)
  - tx_json: JSON object defining the transaction (object, JSON mode)
  - tx_blob: Hex string defining the transaction (string, binary mode)
  - meta: Transaction results metadata in JSON (object, JSON mode)
  - meta_blob: Transaction results metadata as hex string (string, binary mode)
  - validated: Whether the transaction is included in a validated ledger (boolean)
- validated: Whether the information comes from a validated ledger version (boolean)

Note: The server may respond with different values of ledger_index_min and ledger_index_max than provided in the request, for example if it did not have the versions you specified on hand.`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<AccountTxRequest>(),
  }),
  execute: async ({ context, mastra }) => {
    // Extract network and options from the context
    const { network, request } = context

    // Use the shared utility function to execute the account_tx command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_tx' },
      logMessage: 'Account Tx request',
      mastra,
    })
  },
})
