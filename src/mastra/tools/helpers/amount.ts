import { createTool } from '@mastra/core/tools'
import { dropsToXrp, xrpToDrops } from 'xrpl'
import { z } from 'zod'
import { xrplDecimalValueSchema } from '../../../helpers'

export const xrpToDropsTool = createTool({
  id: 'xrp-to-drops',
  description: 'Convert an XRP amount to drops',
  inputSchema: z.object({
    amount: xrplDecimalValueSchema.describe('Amount in XRP, e.g. "1.5"'),
  }),
  outputSchema: z.string().describe('Amount in drops'),
  execute: async inputData => {
    const { amount } = inputData
    return xrpToDrops(amount)
  },
})

export const dropsToXrpTool = createTool({
  id: 'drops-to-xrp',
  description: 'Convert a drops amount to XRP',
  inputSchema: z.object({
    amount: z.string().regex(/^\d+$/, 'Drops must be an integer string').describe('Amount in drops, e.g. "1500000"'),
  }),
  outputSchema: z.number().describe('Amount in XRP'),
  execute: async inputData => {
    const { amount } = inputData
    return dropsToXrp(amount)
  },
})
