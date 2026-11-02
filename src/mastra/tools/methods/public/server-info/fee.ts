import { z } from 'zod'
import { defineMethodTool } from '../../shared'

export const getFeeTool = defineMethodTool({
  id: 'get-fee',
  command: 'fee',
  description: `Get current XRPL transaction fee data: base, median, minimum and open-ledger fee (in drops), plus queue and ledger sizes. Call before submitting a transaction to pick a fee. `,
  request: z.object({}),
  result: {
    current_ledger_size: z.string().optional(),
    current_queue_size: z.string().optional(),
    drops: z
      .looseObject({
        base_fee: z.string(),
        median_fee: z.string(),
        minimum_fee: z.string(),
        open_ledger_fee: z.string(),
      })
      .optional()
      .describe('Fees in drops'),
  },
})
