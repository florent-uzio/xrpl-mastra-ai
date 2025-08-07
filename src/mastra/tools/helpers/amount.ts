import { createTool } from '@mastra/core/tools'
import { dropsToXrp, xrpToDrops } from 'xrpl'
import { z } from 'zod'

export const xrpToDropsTool = createTool({
  id: 'xrp-to-drops',
  description: 'Convert an XRP amount to drops',
  inputSchema: z.object({
    amount: z.string(),
  }),
  execute: async ({ context }) => {
    const { amount } = context
    return xrpToDrops(amount)
  },
})

export const dropsToXrpTool = createTool({
  id: 'drops-to-xrp',
  description: 'Convert a drops amount to XRP',
  inputSchema: z.object({
    amount: z.string(),
  }),
  execute: async ({ context }) => {
    const { amount } = context
    return dropsToXrp(amount)
  },
})
