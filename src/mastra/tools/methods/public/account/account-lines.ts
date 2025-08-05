import { createTool } from '@mastra/core/tools'
import { AccountLinesRequest } from 'xrpl'
import { z } from 'zod'
import { disconnectXrplClient, getXrplClient } from '../../../../../helpers'

export const getAccountLinesTool = createTool({
  id: 'get-account-lines',
  description: `Get an account's trust lines, which contain balances in all non-XRP currencies and assets.

The response includes:
- lines: Array of trust line objects, each containing:
  - account: The account address that holds the trust line
  - balance: The balance of the trust line (can be positive or negative)
  - currency: The currency code (3-letter ISO code for standard currencies, or hex for custom tokens)
  - limit: The maximum amount of this currency the account can hold
  - limit_peer: The maximum amount of this currency the peer can hold
  - quality_in: Exchange rate for incoming payments
  - quality_out: Exchange rate for outgoing payments
  - no_ripple: Whether the trust line has the NoRipple flag set
  - no_ripple_peer: Whether the peer has the NoRipple flag set
  - authorized: Whether the trust line is authorized
  - peer_authorized: Whether the peer has authorized the trust line
  - freeze: Whether the trust line is frozen
  - freeze_peer: Whether the peer has frozen the trust line

Note: This only shows non-XRP currencies and assets. XRP balance is retrieved separately using account_info.`,
  inputSchema: z.object({
    network: z.string(),
    opts: z.custom<AccountLinesRequest>(),
  }),
  execute: async ({ context, mastra }) => {
    // Extract network and options from the context
    const { network, opts } = context

    // Get or create an XRPL client instance for the specified network
    // This handles singleton pattern and connection management
    const client = await getXrplClient(network)

    // Get the logger instance from Mastra for structured logging
    const logger = mastra?.getLogger()

    // Log the account lines request with network URL and request options
    // This helps with debugging and monitoring request patterns
    logger?.info('Account lines request', { url: client.url, opts: JSON.stringify(opts) })

    // Execute the account_lines command on the XRPL network
    // This retrieves trust lines and token balances for the specified account
    const response = await client.request({
      ...opts, // Spread all the user-provided options (account, ledger_index, etc.)
      command: 'account_lines', // Specify the XRPL API command
    })

    // Clean up: Disconnect the XRPL client to free up network resources
    // This is important for resource management and preventing connection leaks
    await disconnectXrplClient(network)

    // Return the account lines response to the user
    // This includes trust lines, balances, and currency information
    return response
  },
})
