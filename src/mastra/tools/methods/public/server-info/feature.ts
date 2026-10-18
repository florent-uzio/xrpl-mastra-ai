import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { networkSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getFeatureTool = createTool({
  id: 'get-feature',
  description: `Get the status of XRPL protocol amendments: whether each is enabled in the latest ledger and whether the server supports it. Pass a name or ID to check one amendment, or omit it to list all.

The result is a map keyed by amendment ID. An amendment that is enabled but not supported can make the server amendment blocked.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      feature: z.string().optional().describe('Amendment ID (hex) or short name. Omit to list all amendments'),
    }),
  }),
  // Amendment IDs are dynamic keys, so the extra fields are kept by the loose result
  outputSchema: xrplMethodResponse({}),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the feature command
    return await executeMethod({
      network,
      request: { ...request, command: 'feature' },
      logMessage: 'Feature request',
      mastra,
    })
  },
})
