import { z } from 'zod'
import { ledgerSpecifierShape, xrplAddressSchema } from '../../../../../helpers'
import { defineMethodTool } from '../../shared'

export const getAccountCurrenciesTool = defineMethodTool({
  id: 'get-account-currencies',
  command: 'account_currencies',
  description: `List currency codes an account can send or receive, derived from its trust lines. Approximate: it ignores freezes and authorization.`,
  request: z.object({
    account: xrplAddressSchema.describe('Account address'),
    ...ledgerSpecifierShape,
  }),
  result: {
    receive_currencies: z.array(z.string()).optional(),
    send_currencies: z.array(z.string()).optional(),
  },
})
