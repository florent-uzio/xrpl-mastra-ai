import { z } from 'zod'
import { ledgerSpecifierShape, xrplAddressSchema } from '../../../../../helpers'
import { defineMethodTool } from '../../shared'

export const getDepositAuthorizedTool = defineMethodTool({
  id: 'get-deposit-authorized',
  command: 'deposit_authorized',
  description: `Check whether a source account may send payments to a destination account that uses Deposit Authorization. deposit_authorized is true if the destination has not enabled it, the source is preauthorized, or the source holds one of the supplied accepted credentials.`,
  request: z.object({
    source_account: xrplAddressSchema.describe('Sender'),
    destination_account: xrplAddressSchema.describe('Receiver'),
    credentials: z.array(z.string().length(64)).optional().describe('Credential ledger entry IDs the sender presents'),
    ...ledgerSpecifierShape,
  }),
  result: {
    deposit_authorized: z.boolean().optional(),
    source_account: z.string().optional(),
    destination_account: z.string().optional(),
  },
})
