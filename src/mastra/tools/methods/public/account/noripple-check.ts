import { z } from 'zod'
import { ledgerSpecifierShape, xrplAddressSchema } from '../../../../../helpers'
import { defineMethodTool } from '../../shared'

export const getNoRippleCheckTool = defineMethodTool({
  id: 'get-noripple-check',
  command: 'noripple_check',
  description: `Check whether an account's DefaultRipple flag and the NoRipple flags of its trust lines are set correctly for its role. Use role "gateway" for token issuers (DefaultRipple on, NoRipple off on lines) and "user" for everyone else (NoRipple on). Returns the problems found and, with transactions true, the AccountSet/TrustSet transactions that would fix them.`,
  request: z.object({
    account: xrplAddressSchema.describe('Account address'),
    role: z.enum(['gateway', 'user']).describe('"gateway" for issuers, "user" for other accounts'),
    transactions: z.boolean().optional().describe('Include suggested fix transactions'),
    limit: z.number().int().positive().optional().describe('Max trust lines to check (default 300)'),
    ...ledgerSpecifierShape,
  }),
  result: {
    problems: z.array(z.string()).optional().describe('Human-readable problems found'),
    transactions: z.array(z.looseObject({})).optional().describe('Suggested fix transactions (unsigned)'),
  },
})
