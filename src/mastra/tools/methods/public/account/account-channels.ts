import { createTool } from '@mastra/core/tools'
import { AccountChannelsRequest, AccountChannelsResponse } from 'xrpl'
import { z } from 'zod'
import { mastra } from '../../../..'
import { disconnectXrplClient, getXrplClient } from '../../../../../helpers'

export const getAccountChannelsTool = createTool({
  id: 'get-account-channels',
  description: `Get an XRP Ledger account's Payment Channels. This method returns information about Payment Channels where the specified account is the channel's source/owner, not the destination. Requires the PayChan amendment to be enabled.

Request Parameters:
- account: Look up channels where this account is the channel's owner/source (string - address, required)
- destination_account: Filter results to payment channels whose destination is this account (string - address, optional)
- amount: The total amount allocated to this channel (object or string, optional)
- balance: The total amount paid out from this channel (object or string, optional)
- ledger_hash: The unique hash of the ledger version to use (string, optional)
- ledger_index: The ledger index to use, or shortcut string like "validated" (number or string, optional)
- limit: Limit the number of channels to retrieve (number, optional, range: 10-400, default: 200)
- marker: Value from previous paginated response for resuming (optional)
- transfer_rate: The fee to charge when users make claims on a payment channel (number, optional)

The response includes:
- account: The address of the source/owner of the payment channels (string)
- channels: Array of payment channel objects owned by this account, each containing:
  - account: The owner of the channel (string - address)
  - amount: The total amount allocated to this channel in drops or tokens (object or string)
  - balance: The total amount paid out from this channel in drops or tokens (string)
  - channel_id: Unique ID for this channel as 64-character hexadecimal string (string)
  - destination_account: The destination account of the channel (string - address)
  - settle_delay: Number of seconds the channel must stay open after close request (unsigned integer)
  - public_key: Public key for the payment channel in base58 format (string, optional)
  - public_key_hex: Public key for the payment channel in hexadecimal format (string, optional)
  - expiration: Time when this channel is set to expire in seconds since Ripple Epoch (unsigned integer, optional)
  - cancel_after: Immutable expiration time in seconds since Ripple Epoch (unsigned integer, optional)
  - source_tag: 32-bit unsigned integer for source tag for payments through this channel (unsigned integer, optional)
  - destination_tag: 32-bit unsigned integer for destination tag for payments through this channel (unsigned integer, optional)
- ledger_hash: The identifying hash of the ledger version used (string, optional)
- ledger_index: The ledger index of the ledger version used (number)
- validated: Whether the information comes from a validated ledger version (boolean, optional)
- limit: The limit to how many channel objects were actually returned (number, optional)
- marker: Server-defined value for pagination, omitted when no additional pages (optional)

Note: You can calculate the amount left in a channel by subtracting balance from amount. Only the destination account can receive the amount in the channel while it is open.`,
  inputSchema: z.object({
    network: z.string(),
    opts: z.custom<AccountChannelsRequest>(),
  }),
  execute: async ({ context }) => {
    const { network, opts } = context

    const accountChannels = await getAccountChannels(network, opts)

    return accountChannels
  },
})

/**
 * Get account payment channels
 * @param network - The network to use
 * @param opts - The request options to use
 * @returns The account payment channels
 */
const getAccountChannels = async (network: string, opts: AccountChannelsRequest): Promise<AccountChannelsResponse> => {
  const client = await getXrplClient(network)

  const logger = mastra.getLogger()

  logger.info('Account channels request', { url: client.url, opts: JSON.stringify(opts) })

  const response = await client.request({
    ...opts,
    command: 'account_channels',
  })

  // Disconnect the client
  await disconnectXrplClient(network)

  return response
}
