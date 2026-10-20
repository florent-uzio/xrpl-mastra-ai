import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getNoRippleCheckTool = createTool({
  id: 'get-noripple-check',
  description: `Check whether an account's DefaultRipple flag and the NoRipple flags of its trust lines are set correctly for its role. Use role "gateway" for token issuers (DefaultRipple on, NoRipple off on lines) and "user" for everyone else (NoRipple on). Returns the problems found and, with transactions true, the AccountSet/TrustSet transactions that would fix them.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      account: xrplAddressSchema.describe('Account address'),
      role: z.enum(['gateway', 'user']).describe('"gateway" for issuers, "user" for other accounts'),
      transactions: z.boolean().optional().describe('Include suggested fix transactions'),
      limit: z.number().int().positive().optional().describe('Max trust lines to check (default 300)'),
      ...ledgerSpecifierShape,
    }),
  }),
  outputSchema: xrplMethodResponse({
    problems: z.array(z.string()).optional().describe('Human-readable problems found'),
    transactions: z.array(z.looseObject({})).optional().describe('Suggested fix transactions (unsigned)'),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'noripple_check' },
      logMessage: 'NoRipple check request',
      mastra,
    })
  },
})
