import { createTool } from '@mastra/core/tools'
import { AccountObjectsRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getAccountObjectsTool = createTool({
  id: 'get-account-objects',
  description: `Get the raw ledger objects owned by an account (checks, escrows, offers, NFT pages, trust lines, tickets, signer lists, etc.). For a readable view of trust lines use get-account-lines.

Request parameters:
- account: address (required)
- type: optional filter (case-insensitive): check, deposit_preauth, escrow, nft_offer, nft_page, offer, payment_channel, signer_list, state (trust lines), ticket, bridge, mptoken
- deletion_blockers_only: boolean, optional. Only objects that block account deletion.
- ledger_index: number or "validated" | "current" (optional)
- ledger_hash: string (optional)
- limit: 10-400, default 200 (optional)
- marker: pagination marker from a previous response (optional)`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<AccountObjectsRequest>(),
  }),
  execute: async (inputData, { mastra }) => {
    // Extract network and options from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the account_objects command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_objects' },
      logMessage: 'Account objects request',
      mastra,
    })
  },
})
