import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod } from '../../shared'

export const getAccountCurrenciesTool = createTool({
  id: 'get-account-currencies',
  description: `List currency codes an account can send or receive, derived from its trust lines. Approximate: it ignores freezes and authorization.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      account: xrplAddressSchema.describe('Account address'),
      ...ledgerSpecifierShape,
    }),
  }),
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the account_currencies command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_currencies' },
      logMessage: 'Account currencies request',
      mastra,
    })
  },
})
