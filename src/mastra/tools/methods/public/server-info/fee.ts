import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { networkSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getFeeTool = createTool({
  id: 'get-fee',
  description: `Get current XRPL transaction fee data: base, median, minimum and open-ledger fee (in drops), plus queue and ledger sizes. Call before submitting a transaction to pick a fee. `,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({}),
  }),
  outputSchema: xrplMethodResponse({
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
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the fee command
    return await executeMethod({
      network,
      request: { ...request, command: 'fee' },
      logMessage: 'Fee request',
      mastra,
    })
  },
})
