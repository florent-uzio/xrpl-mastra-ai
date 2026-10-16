import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { networkSchema } from '../../../../../helpers'
import { executeMethod } from '../../shared'

export const getFeeTool = createTool({
  id: 'get-fee',
  description: `Get current XRPL transaction fee data: base, median, minimum and open-ledger fee (in drops), plus queue and ledger sizes. Call before submitting a transaction to pick a fee. `,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({}),
  }),
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
