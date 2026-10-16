import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { listFlowRecords, saveFlowRecord } from '../../../helpers'

export const getFlowRecordsTool = createTool({
  id: 'get-flow-records',
  description: `Look up records saved by earlier workflow runs (e.g. iou-issuance, mpt-issuance) or saved manually with save-flow-record: network, issuer and holder addresses and seeds, token IDs, transaction hashes. Use it when the user wants to reuse wallets or tokens from a previous run or session.

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

export const saveFlowRecordTool = createTool({
  id: 'save-flow-record',
  description: `Save information from actions done manually in this conversation (wallets created, NFT/MPT minted, payments sent, ...) so it can be looked up later, even in another session, with get-flow-records. Testnet/devnet only: the data may include wallet seeds.

Input:
- flow: a short kebab-case name for what was done, e.g. "manual-nft-test" (letters, digits, "-" and "_")
- network: the network used, e.g. "testnet"
- data: free-form object with whatever is worth keeping: wallet addresses and seeds, token IDs, transaction hashes, ... Only include values that actually appeared in this conversation, never invent any.

Returns the id of the saved record. Do not repeat seeds in your reply unless the user asks.`,
  inputSchema: z.object({
    flow: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/, 'Only letters, digits, "-" and "_"')
      .describe('Flow name, e.g. "manual-nft-test"'),
    network: z.string().describe('Network name, e.g. "testnet" or "devnet"'),
    data: z.record(z.string(), z.unknown()).describe('Free-form data to save'),
  }),
  outputSchema: z.object({ id: z.string(), flow: z.string(), createdAt: z.string() }),
  execute: async input => {
    const { record } = await saveFlowRecord(input)
    return { id: record.id, flow: record.flow, createdAt: record.createdAt }
  },
})
