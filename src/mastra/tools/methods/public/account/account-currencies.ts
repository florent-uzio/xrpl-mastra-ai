import { createTool } from '@mastra/core/tools'
import { AccountCurrenciesRequest } from 'xrpl'
import { z } from 'zod'
import { disconnectXrplClient, getXrplClient } from '../../../../../helpers'

export const getAccountCurrenciesTool = createTool({
  id: 'get-account-currencies',
  description: `Get an XRP Ledger account's currencies. This method retrieves a list of currencies that an account can send or receive, based on its trust lines. This is not a thoroughly confirmed list, but it can be used to populate user interfaces.

Request Parameters:
- account: Look up currencies this account can send or receive (string - address, required)
- ledger_hash: The unique hash of the ledger version to use (string, optional)
- ledger_index: The ledger index to use, or shortcut string like "validated" (number or string, optional)

Note: The following fields are deprecated and should not be provided: account_index, strict.

The response includes:
- ledger_hash: The identifying hash of the ledger version used to retrieve this data as hex (string, optional)
- ledger_index: The ledger index of the ledger version used to retrieve this data (integer)
- receive_currencies: Array of currency codes for currencies that this account can receive (array of strings)
- send_currencies: Array of currency codes for currencies that this account can send (array of strings)
- validated: Whether this data comes from a validated ledger (boolean)

Important Notes:
- The currencies that an account can send or receive are defined based on a check of its trust lines
- If an account has a trust line for a currency and enough room to increase its balance, it can receive that currency
- If the trust line's balance can go down, the account can send that currency
- This method doesn't check whether the trust line is frozen or authorized
- Currency codes can be standard 3-letter codes (like "USD", "EUR", "BTC") or hex strings for custom currencies
- The list is not thoroughly confirmed but useful for populating user interfaces

Possible Errors:
- invalidParams: One or more fields are specified incorrectly, or one or more required fields are missing
- actNotFound: The address specified in the account field of the request does not correspond to an account in the ledger
- lgrNotFound: The ledger specified by the ledger_hash or ledger_index does not exist, or it does exist but the server does not have it
- Any of the universal error types`,
  inputSchema: z.object({
    network: z.string(),
    opts: z.custom<AccountCurrenciesRequest>(),
  }),
  execute: async ({ context, mastra }) => {
    const { network, opts } = context

    const client = await getXrplClient(network)

    const logger = mastra?.getLogger()

    logger?.info('Account currencies request', { url: client.url, opts: JSON.stringify(opts) })

    const response = await client.request({
      ...opts,
      command: 'account_currencies',
    })

    // Disconnect the client
    await disconnectXrplClient(network)

    return response
  },
})
