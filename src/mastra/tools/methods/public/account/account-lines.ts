import { createTool } from '@mastra/core/tools'
import { AccountLinesRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getAccountLinesTool = createTool({
  id: 'get-account-lines',
  description: `Get an XRP Ledger account's trust lines. This method returns information about an account's trust lines for non-XRP currencies and assets (tokens). Trust lines are required for holding non-XRP currencies on the XRPL.

Request Parameters:
- account: The account to look up (string - address, required)
- ledger_hash: The unique hash of the ledger version to use (string, optional)
- ledger_index: The ledger index to use, or shortcut string like "validated" (number or string, optional)
- peer: Filter results to a specific peer account (string - address, optional)
- limit: Limit the number of trust lines to retrieve (number, optional, range: 10-400, default: 200)
- marker: Value from previous paginated response for resuming (optional)

The response includes:
- account: The account that owns the trust lines (string)
- lines: Array of trust line objects, each containing:
  - account: The peer account in this trust line (string - address)
  - balance: The balance of the currency/token (string)
  - currency: The currency code (string)
  - limit: The trust line limit (string)
  - limit_peer: The limit set by the peer account (string)
  - quality_in: Exchange rate for incoming payments (number, optional)
  - quality_out: Exchange rate for outgoing payments (number, optional)
  - no_ripple: Whether rippling is disabled for this trust line (boolean, optional)
  - no_ripple_peer: Whether rippling is disabled by the peer (boolean, optional)
  - authorized: Whether this trust line is authorized (boolean, optional)
  - peer_authorized: Whether the peer has authorized this trust line (boolean, optional)
  - freeze: Whether this trust line is frozen (boolean, optional)
  - freeze_peer: Whether the peer has frozen this trust line (boolean, optional)
- ledger_hash: The identifying hash of the ledger version used (string, optional)
- ledger_index: The ledger index of the ledger version used (number)
- validated: Whether the information comes from a validated ledger version (boolean, optional)
- limit: The limit to how many trust line objects were actually returned (number, optional)
- marker: Server-defined value for pagination, omitted when no additional pages (optional)

Important Notes:
- Trust lines are required for holding non-XRP currencies and tokens
- Balance shows the current amount held (positive = owed to you, negative = you owe)
- Limit shows the maximum amount that can be held in this trust line
- Quality values affect exchange rates for cross-currency payments
- Freeze flags indicate if the trust line is frozen by either party
- Authorization flags indicate if explicit authorization is required
- Pagination uses marker-based system for accounts with many trust lines

Possible Errors:
- invalidParams: One or more fields are specified incorrectly, or one or more required fields are missing
- actNotFound: The address specified in the account field does not correspond to an account in the ledger
- lgrNotFound: The ledger specified by ledger_hash or ledger_index does not exist, or the server doesn't have it
- Any of the universal error types`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<AccountLinesRequest>(),
  }),
  execute: async ({ context, mastra }) => {
    // Extract network and request from the context
    const { network, request } = context

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
