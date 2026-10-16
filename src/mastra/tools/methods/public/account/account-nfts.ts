import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, paginationMarkerSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod } from '../../shared'

export const getAccountNFTsTool = createTool({
  id: 'get-account-nfts',
  description: `List the NFTs owned by an account.

URI is returned hex-encoded; decode it to read it.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      account: xrplAddressSchema.describe('Account address'),
      ...ledgerSpecifierShape,
      limit: z
        .number()
        .int()
        .min(20)
        .max(400)
        .optional()
        .describe('Max results per page (20-400, default 100). Counts NFToken pages (up to 32 NFTs each), not NFTs.'),
      marker: paginationMarkerSchema,
    }),
  }),
  execute: async (inputData, { mastra }) => {
    // Extract network and options from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the account_nfts command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_nfts' },
      logMessage: 'Account NFTs request',
      mastra,
    })
  },
})
