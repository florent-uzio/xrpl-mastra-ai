import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { networkSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const pingTool = createTool({
  id: 'ping',
  description: `Check that the XRPL server is reachable and responding. Returns an empty result on success.`,
  inputSchema: z.object({ network: networkSchema, request: z.object({}) }),
  outputSchema: xrplMethodResponse({}),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'ping' },
      logMessage: 'Ping request',
      mastra,
    })
  },
})

export const getRandomTool = createTool({
  id: 'get-random',
  description: `Get 256 random bits (64 hex characters) from the XRPL server. Not suitable for generating secrets.`,
  inputSchema: z.object({ network: networkSchema, request: z.object({}) }),
  outputSchema: xrplMethodResponse({
    random: z.string().optional().describe('64 hex characters'),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'random' },
      logMessage: 'Random request',
      mastra,
    })
  },
})
