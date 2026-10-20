import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { networkSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getChannelVerifyTool = createTool({
  id: 'get-channel-verify',
  description: `Check whether a payment channel claim signature is valid for a given channel and amount. Pure verification: no secret is needed and nothing is submitted.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      channel_id: z.string().length(64).describe('Payment channel ID (64 hex characters)'),
      amount: z.string().describe('Claim amount in drops'),
      public_key: z.string().describe('Channel public key, hex or base58'),
      signature: z.string().describe('Claim signature, hex'),
    }),
  }),
  outputSchema: xrplMethodResponse({
    signature_verified: z.boolean().optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'channel_verify' },
      logMessage: 'Channel verify request',
      mastra,
    })
  },
})
