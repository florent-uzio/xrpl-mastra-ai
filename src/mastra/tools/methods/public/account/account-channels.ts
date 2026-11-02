import { z } from 'zod'
import { ledgerSpecifierShape, paginationMarkerSchema, xrplAddressSchema } from '../../../../../helpers'
import { defineMethodTool } from '../../shared'

export const getAccountChannelsTool = defineMethodTool({
  id: 'get-account-channels',
  command: 'account_channels',
  description: `List Payment Channels where the account is the source (not the destination).

Funds left in a channel = amount - balance.`,
  request: z.object({
    account: xrplAddressSchema.describe('Source account address'),
    destination_account: xrplAddressSchema.optional().describe('Only channels to this address'),
    ...ledgerSpecifierShape,
    limit: z.number().int().min(10).max(400).optional().describe('Max results per page (10-400, default 200).'),
    marker: paginationMarkerSchema,
  }),
  result: {
    account: z.string().optional(),
    channels: z
      .array(
        z.looseObject({
          channel_id: z.string(),
          destination_account: z.string(),
          amount: z.string().describe('Total drops allocated to the channel'),
          balance: z.string().describe('Drops already paid out; funds left = amount - balance'),
        }),
      )
      .optional(),
  },
})
