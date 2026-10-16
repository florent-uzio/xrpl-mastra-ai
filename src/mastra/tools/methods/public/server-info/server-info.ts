import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { networkSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getServerInfoTool = createTool({
  id: 'get-server-info',
  description: `Get rippled server status: build version, server_state, complete_ledgers, load factor, peers, and the latest validated ledger (seq, hash, base fee, reserves in XRP).

A closed_ledger with a short seq (under 8 digits) means the server is still syncing.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      counters: z.boolean().optional().describe('Add job queue and API metrics'),
    }),
  }),
  outputSchema: xrplMethodResponse({
    info: z
      .looseObject({
        build_version: z.string(),
        server_state: z.string(),
        complete_ledgers: z.string(),
        validated_ledger: z
          .looseObject({
            seq: z.number(),
            hash: z.string(),
            base_fee_xrp: z.number(),
            reserve_base_xrp: z.number(),
            reserve_inc_xrp: z.number(),
          })
          .optional(),
      })
      .partial()
      .optional(),
  }),
  outputValidation: 'warn',
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
