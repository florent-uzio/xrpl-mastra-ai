import { z } from 'zod'
import { ledgerSpecifierShape, xrplAddressSchema, xrplDecimalValueSchema } from '../../../../../helpers'
import { xrplAssetAmountSchema, xrplAssetSchema, xrplCurrencyAmountSchema } from '../../../transactions/shared'
import { defineMethodTool } from '../../shared'

/** destination_amount also accepts "-1": deliver as much as possible */
const destinationAmountSchema = z.union([
  xrplAssetAmountSchema,
  xrplCurrencyAmountSchema.extend({ value: z.union([xrplDecimalValueSchema, z.literal('-1')]) }),
])

export const getRipplePathFindTool = defineMethodTool({
  id: 'get-ripple-path-find',
  command: 'ripple_path_find',
  description: `Find payment paths (a one-off snapshot) for sending a cross-currency or cross-issuer Payment. Returns alternatives, each with the source_amount needed and paths_computed to copy into the Payment's Paths field. destination_amount is a drops string for XRP, or { currency, issuer, value } for tokens (use value "-1" to ask for the largest possible amount).`,
  request: z.object({
    source_account: xrplAddressSchema.describe('Sender'),
    destination_account: xrplAddressSchema.describe('Receiver'),
    destination_amount: destinationAmountSchema.describe(
      'Amount the receiver should get, or value "-1" for as much as possible',
    ),
    send_max: xrplAssetAmountSchema.optional().describe('Maximum the sender is willing to spend'),
    source_currencies: z
      .array(xrplAssetSchema)
      .max(18)
      .optional()
      .describe('Currencies the sender may spend (default: all they hold)'),
    ...ledgerSpecifierShape,
  }),
  result: {
    alternatives: z
      .array(
        z.looseObject({
          paths_computed: z.array(z.unknown()).optional().describe('Value for Payment.Paths'),
          source_amount: z.unknown().optional(),
        }),
      )
      .optional(),
    destination_account: z.string().optional(),
    destination_amount: z.unknown().optional(),
  },
})
