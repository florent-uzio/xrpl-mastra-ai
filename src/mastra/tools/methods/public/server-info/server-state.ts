import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { networkSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getServerStateTool = createTool({
  id: 'get-server-state',
  description: `Get rippled server status in machine-readable form: like server_info, but amounts are raw numbers in drops (base fee, reserves) and load factors are unscaled. Includes build version, server_state, complete_ledgers, peers, load factors and the latest validated ledger.

Prefer getServerInfoTool for a human-readable summary.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({}),
  }),
  outputSchema: xrplMethodResponse({
    state: z
      .looseObject({
        build_version: z.string(),
        server_state: z.string(),
        complete_ledgers: z.string(),
        load_base: z.number(),
        load_factor: z.number(),
        peers: z.number(),
        validated_ledger: z
          .looseObject({
            seq: z.number(),
            hash: z.string(),
            base_fee: z.number().describe('In drops'),
            reserve_base: z.number().describe('In drops'),
            reserve_inc: z.number().describe('In drops'),
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

    // Use the shared utility function to execute the server_state command
    return await executeMethod({
      network,
      request: { ...request, command: 'server_state' },
      logMessage: 'Server state request',
      mastra,
    })
  },
})
