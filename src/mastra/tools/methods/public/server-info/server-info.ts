import { createTool } from '@mastra/core/tools'
import { ServerInfoRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getServerInfoTool = createTool({
  id: 'get-server-info',
  description: `Get rippled server status: build version, server_state, complete_ledgers, load factor, peers, and the latest validated ledger (seq, hash, base fee, reserves in XRP).

Request parameters:
- counters: boolean, optional. Adds job queue and API metrics.

A closed_ledger with a short seq (under 8 digits) means the server is still syncing.`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<ServerInfoRequest>(),
  }),
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the server_info command
    return await executeMethod({
      network,
      request: { ...request, command: 'server_info' },
      logMessage: 'Server info request',
      mastra,
    })
  },
})
