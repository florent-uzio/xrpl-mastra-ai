import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { listFlowRecords } from '../../../helpers'

export const getFlowRecordsTool = createTool({
  id: 'get-flow-records',
  description: `Look up records saved by earlier workflow runs (e.g. iou-issuance, mpt-issuance): network, issuer and holder addresses and seeds, token IDs, transaction hashes. Use it when the user wants to reuse wallets or tokens from a previous run.

Input:
- flow: only records of this flow, e.g. "mpt-issuance" (optional)
- id: return only the record with this id (optional)

Records are returned newest first. The data includes wallet seeds (secrets, testnet/devnet only). Show addresses by default and only show seeds if the user asks for them.`,
  inputSchema: z.object({
    flow: z.string().optional().describe('Flow name, e.g. "iou-issuance" or "mpt-issuance"'),
    id: z.string().optional().describe('Record id, as returned by a previous workflow run'),
  }),
  outputSchema: z.object({
    records: z.array(
      z.object({
        id: z.string(),
        flow: z.string(),
        network: z.string(),
        createdAt: z.string(),
        data: z.record(z.string(), z.unknown()),
      }),
    ),
  }),
  execute: async ({ flow, id }) => {
    const records = await listFlowRecords(flow)
    return { records: id ? records.filter(r => r.id === id) : records }
  },
})
