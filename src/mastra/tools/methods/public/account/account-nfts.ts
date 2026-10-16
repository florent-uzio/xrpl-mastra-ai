import { createTool } from '@mastra/core/tools'
import { AccountNFTsRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getAccountNFTsTool = createTool({
  id: 'get-account-nfts',
  description: `List the NFTs owned by an account.

Request parameters:
- account: address (required)
- ledger_index: number or "validated" | "current" (optional)
- ledger_hash: string (optional)
- limit: 20-400, default 100. Counts NFToken pages (up to 32 NFTs each), not NFTs. (optional)
- marker: pagination marker from a previous response (optional)

URI is returned hex-encoded; decode it to read it.`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<AccountNFTsRequest>(),
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
