import { createTool } from '@mastra/core/tools'
import { AccountOffersRequest, AccountOffersResponse } from 'xrpl'
import { z } from 'zod'
import { mastra } from '../../..'
import { disconnectXrplClient, getXrplClient } from '../../../../helpers'

export const getAccountOffersTool = createTool({
  id: 'get-account-offers',
  description: `Get an XRP Ledger account's outstanding offers. This method retrieves a list of offers made by a given account that are outstanding as of a particular ledger version.

Request Parameters:
- account: Look up offers placed by this account (string - address, required)
- ledger_hash: The unique hash of the ledger version to use (string, optional)
- ledger_index: The ledger index to use, or shortcut string like "validated" (string or number, optional)
- limit: Limit the number of offers to retrieve (number, optional, range: 10-400, default: 200)
- marker: Value from previous paginated response for resuming (optional)

Note: The following parameters are deprecated and should not be provided: ledger, strict.

The response includes:
- account: Unique address identifying the account that made the offers (string)
- offers: Array of offer objects, each representing an outstanding offer made by this account. Each offer contains:
  - flags: Options set for this offer entry as bit-flags (unsigned integer)
  - seq: Sequence number of the transaction that created this entry (unsigned integer)
  - taker_gets: The amount the account accepting the offer receives (string for XRP or object for tokens)
  - taker_pays: The amount the account accepting the offer provides (string for XRP or object for tokens)
  - quality: The exchange rate of the offer, as ratio of original taker_pays divided by original taker_gets (string)
  - expiration: Time after which this offer is considered unfunded, in seconds since Ripple Epoch (unsigned integer, optional)

- ledger_current_index: The ledger index of the current in-progress ledger version (number, optional)
- ledger_index: The ledger index of the ledger version used (number, optional)
- ledger_hash: The identifying hash of the ledger version used (string, optional)
- marker: Server-defined value for pagination, omitted when no additional pages (optional)
- validated: Whether the information comes from a validated ledger version (boolean)

Note: When executing offers, the offer with the most favorable (lowest) quality is consumed first; offers with the same quality are executed from oldest to newest.`,
  inputSchema: z.object({
    network: z.string(),
    opts: z.custom<AccountOffersRequest>(),
  }),
  execute: async ({ context }) => {
    const { network, opts } = context

    const accountInfo = await getAccountOffers(network, opts)

    return accountInfo
  },
})

/**
 * Get account Offers
 * @param network - The network to use
 * @param opts - The request options to use
 * @returns The account offers
 */
const getAccountOffers = async (network: string, opts: AccountOffersRequest): Promise<AccountOffersResponse> => {
  const client = await getXrplClient(network)

  const logger = mastra.getLogger()

  logger.info('Account offers request', { url: client.url, opts: JSON.stringify(opts) })

  const response = await client.request({
    ...opts,
    command: 'account_offers',
  })

  // Disconnect the client
  await disconnectXrplClient(network)

  return response
}
