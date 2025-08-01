import { createTool } from '@mastra/core/tools'
import z from 'zod'
import { getXrplClient } from '../../../helpers'

export const isClientConnectedTool = createTool({
  id: 'is-client-connected',
  description: 'Check if the client is connected to the XRP Ledger',
  inputSchema: z.object({
    network: z.string(),
  }),
  execute: async ({ context }) => {
    const { network } = context

    const client = await getXrplClient(network)

    return client.isConnected()
  },
})
