import { z } from 'zod'
import { defineMethodTool } from '../../shared'

export const pingTool = defineMethodTool({
  id: 'ping',
  command: 'ping',
  description: `Check that the XRPL server is reachable and responding. Returns an empty result on success.`,
  request: z.object({}),
  result: {},
})

export const getRandomTool = defineMethodTool({
  id: 'get-random',
  command: 'random',
  description: `Get 256 random bits (64 hex characters) from the XRPL server. Not suitable for generating secrets.`,
  request: z.object({}),
  result: {
    random: z.string().optional().describe('64 hex characters'),
  },
})
