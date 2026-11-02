import { z } from 'zod'
import { defineMethodTool } from '../../shared'

export const getServerStateTool = defineMethodTool({
  id: 'get-server-state',
  command: 'server_state',
  description: `Get rippled server status in machine-readable form: like server_info, but amounts are raw numbers in drops (base fee, reserves) and load factors are unscaled. Includes build version, server_state, complete_ledgers, peers, load factors and the latest validated ledger.

Prefer getServerInfoTool for a human-readable summary.`,
  request: z.object({}),
  result: {
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
  },
})
