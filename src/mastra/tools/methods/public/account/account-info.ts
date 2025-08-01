import { createTool } from '@mastra/core/tools'
import { AccountInfoRequest, AccountInfoResponse } from 'xrpl'
import { z } from 'zod'
import { mastra } from '../../../..'
import { disconnectXrplClient, getXrplClient } from '../../../../../helpers'

export const getAccountInfoTool = createTool({
  id: 'get-account-info',
  description: `Get an XRP Ledger account info including balance, sequence, and account flags. 
  
IMPORTANT: The balance is returned in drops, not XRP. 1 XRP = 1,000,000 drops. 
To convert drops to XRP, divide by 1,000,000. For example, 1000000 drops = 1 XRP.

The response includes:
- account_data.balance: Account balance in drops (string)
- account_data.sequence: Current sequence number for this account (number)
- account_data.OwnerCount: Number of objects this account owns in the ledger (number)
- account_data.Flags: Flags set on this account (number)
- ledger_current_index: The ledger index of the current in-progress ledger (number)
- validated: Whether this data is from a validated ledger (boolean)`,
  inputSchema: z.object({
    network: z.string(),
    opts: z.custom<AccountInfoRequest>(),
  }),
  execute: async ({ context }) => {
    const { network, opts } = context

    const accountInfo = await getAccountInfo(network, opts)

    return accountInfo
  },
})

/**
 * Get account info
 * @param network - The network to use
 * @param opts - The request options to use
 * @returns The account info
 */
const getAccountInfo = async (network: string, opts: AccountInfoRequest): Promise<AccountInfoResponse> => {
  const client = await getXrplClient(network)

  const logger = mastra.getLogger()

  logger.info('Account info request', { url: client.url, opts: JSON.stringify(opts) })

  const accountInfo = await client.request({
    ...opts,
    command: 'account_info',
  })

  // Disconnect the client
  await disconnectXrplClient(network)

  return accountInfo
}
