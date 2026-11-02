import { z } from 'zod'
import { defineMethodTool } from '../../shared'

export const getChannelVerifyTool = defineMethodTool({
  id: 'get-channel-verify',
  command: 'channel_verify',
  description: `Check whether a payment channel claim signature is valid for a given channel and amount. Pure verification: no secret is needed and nothing is submitted.`,
  request: z.object({
    channel_id: z.string().length(64).describe('Payment channel ID (64 hex characters)'),
    amount: z.string().describe('Claim amount in drops'),
    public_key: z.string().describe('Channel public key, hex or base58'),
    signature: z.string().describe('Claim signature, hex'),
  }),
  result: {
    signature_verified: z.boolean().optional(),
  },
})
