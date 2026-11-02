import { z } from 'zod'
import { defineMethodTool } from '../../shared'

export const getServerInfoTool = defineMethodTool({
  id: 'get-server-info',
  command: 'server_info',
  description: `Get rippled server status: build version, server_state, complete_ledgers, load factor, peers, and the latest validated ledger (seq, hash, base fee, reserves in XRP).

A closed_ledger with a short seq (under 8 digits) means the server is still syncing.`,
  request: z.object({
    counters: z.boolean().optional().describe('Add job queue and API metrics'),
  }),
  result: {
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
  },
})
