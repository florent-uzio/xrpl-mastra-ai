import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod } from '../../shared'

export const getAccountInfoTool = createTool({
  id: 'get-account-info',
  description: `Get an account's XRP balance, sequence, owner count and flags (AccountRoot).

Balance is in drops (1 XRP = 1,000,000 drops). Error actNotFound means the account does not exist or is not funded.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      account: xrplAddressSchema.describe('Account address'),
      ...ledgerSpecifierShape,
      queue: z.boolean().optional().describe('Include queued transactions (current ledger only)'),
      signer_lists: z.boolean().optional().describe('Include SignerList objects'),
    }),
  }),
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the account_info command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_info' },
      logMessage: 'Account info request',
      mastra,
    })
  },
})
