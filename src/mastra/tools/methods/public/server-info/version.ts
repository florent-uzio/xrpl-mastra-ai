import { createTool } from '@mastra/core/tools'
import { Request } from 'xrpl'
import { z } from 'zod'
import { networkSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getVersionTool = createTool({
  id: 'get-version',
  description: `Get the range of API versions a rippled server supports: the lowest (first), the default (good) and the highest (last).`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({}),
  }),
  outputSchema: xrplMethodResponse({
    version: z
      .looseObject({
        first: z.string(),
        good: z.string(),
        last: z.string(),
      })
      .partial()
      .optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the version command
    return await executeMethod({
      network,
      // xrpl.js does not list 'version' in its Request type yet
      request: { ...request, command: 'version' } as unknown as Request,
      logMessage: 'Version request',
      mastra,
    })
  },
})
