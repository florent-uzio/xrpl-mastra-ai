import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, paginationMarkerSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getAccountObjectsTool = createTool({
  id: 'get-account-objects',
  description: `Get the raw ledger objects owned by an account (checks, escrows, offers, NFT pages, trust lines, tickets, signer lists, etc.). For a readable view of trust lines use get-account-lines.

This is the only way to read an account's Multi-Purpose Token (MPT) balances: use type "mptoken" (each MPToken object has MPTokenIssuanceID and MPTAmount, the balance). get-account-lines does not return MPTs.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      account: xrplAddressSchema.describe('Account address'),
      type: z
        .enum([
          'check',
          'deposit_preauth',
          'escrow',
          'nft_offer',
          'nft_page',
          'offer',
          'payment_channel',
          'signer_list',
          'state',
          'ticket',
          'bridge',
          'mptoken',
        ])
        .optional()
        .describe('Only objects of this type (state = trust lines, mptoken = MPT holdings/balances)'),
      deletion_blockers_only: z.boolean().optional().describe('Only objects that block account deletion'),
      ...ledgerSpecifierShape,
      limit: z.number().int().min(10).max(400).optional().describe('Max results per page (10-400, default 200).'),
      marker: paginationMarkerSchema,
    }),
  }),
  outputSchema: xrplMethodResponse({
    account: z.string().optional(),
    account_objects: z.array(z.looseObject({ LedgerEntryType: z.string() })).optional(),
  }),
  outputValidation: 'warn',
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
