import { z } from 'zod'
import { ledgerSpecifierShape, xrplAddressSchema } from '../../../../../helpers'
import { defineMethodTool } from '../../shared'

export const getAccountInfoTool = defineMethodTool({
  id: 'get-account-info',
  command: 'account_info',
  description: `Get an account's XRP balance, sequence, owner count and flags (AccountRoot).

Balance is in drops (1 XRP = 1,000,000 drops). Error actNotFound means the account does not exist or is not funded.`,
  request: z.object({
    account: xrplAddressSchema.describe('Account address'),
    ...ledgerSpecifierShape,
    queue: z.boolean().optional().describe('Include queued transactions (current ledger only)'),
    signer_lists: z.boolean().optional().describe('Include SignerList objects'),
  }),
  result: {
    account_data: z
      .looseObject({
        Account: z.string(),
        Balance: z.string().describe('XRP balance in drops'),
        Sequence: z.number(),
        OwnerCount: z.number(),
        Flags: z.number(),
      })
      .optional(),
    signer_lists: z.array(z.looseObject({})).optional(),
    queue_data: z.looseObject({}).optional(),
  },
})
