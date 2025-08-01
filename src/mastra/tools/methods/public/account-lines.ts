import { createTool } from '@mastra/core/tools'
import { AccountLinesRequest } from 'xrpl'
import { z } from 'zod'
import { mastra } from '../../..'
import { getXrplClient } from '../../../../helpers'

export const getAccountLinesTool = createTool({
  id: 'get-account-lines',
  description:
    "The account_lines method returns information about an account's trust lines, which contain balances in all non-XRP currencies and assets. All information retrieved is relative to a particular version of the ledger.",
  inputSchema: z.object({
    network: z.string(),
    opts: z.custom<AccountLinesRequest>(),
  }),
  execute: async ({ context }) => {
    const { network, opts } = context

    const accountInfo = await getAccountLines(network, opts)

    return accountInfo
  },
})

/**
 * Get account lines
 * @param network - The network to use
 * @param opts - The request options to use
 * @returns The account lines
 */
const getAccountLines = async (network: string, opts: AccountLinesRequest) => {
  const client = await getXrplClient(network)

  const logger = mastra.getLogger()

  logger.info('Account lines request', { clientUrl: client.url, requestOpts: JSON.stringify(opts) })

  const response = await client.request({
    ...opts,
    command: 'account_lines',
  })

  // Disconnect the client
  await client.disconnect()

  return response
}
