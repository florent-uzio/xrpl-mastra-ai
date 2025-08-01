import { createTool } from '@mastra/core/tools'
import { AccountInfoRequest } from 'xrpl'
import { z } from 'zod'
import { mastra } from '../../..'
import { getXrplClient } from '../../../../helpers'

export const getAccountInfoTool = createTool({
  id: 'get-account-info',
  description: 'Get an XRP Ledger account info',
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
const getAccountInfo = async (network: string, opts: AccountInfoRequest) => {
  const client = await getXrplClient(network)

  const logger = mastra.getLogger()

  logger.info('Account info request', { url: client.url, opts: JSON.stringify(opts) })

  const accountInfo = await client.request({
    ...opts,
    command: 'account_info',
  })

  // Disconnect the client
  await client.disconnect()

  return accountInfo
}
