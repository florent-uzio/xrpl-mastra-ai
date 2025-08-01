import { createTool } from '@mastra/core/tools'
import z from 'zod'
import { getXrplClient } from '../../../helpers'

export const isClientConnectedTool = createTool({
  id: 'get-account-lines',
  description:
    "The account_lines method returns information about an account's trust lines, which contain balances in all non-XRP currencies and assets. All information retrieved is relative to a particular version of the ledger.",
  inputSchema: z.object({
    network: z.string(),
  }),
  execute: async ({ context }) => {
    const { network } = context

    const client = await getXrplClient(network)

    return client.isConnected()
  },
})
