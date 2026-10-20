import { createTool } from '@mastra/core/tools'
import { Request } from 'xrpl'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, xrplAddressSchema } from '../../../../../helpers'
import { encodeCurrencyCodes, xrplAssetAmountSchema, xrplAssetSchema } from '../../../transactions/shared'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getRipplePathFindTool = createTool({
  id: 'get-ripple-path-find',
  description: `Find payment paths (a one-off snapshot) for sending a cross-currency or cross-issuer Payment. Returns alternatives, each with the source_amount needed and paths_computed to copy into the Payment's Paths field. destination_amount is a drops string for XRP, or { currency, issuer, value } for tokens (use value "-1" to ask for the largest possible amount).`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      source_account: xrplAddressSchema.describe('Sender'),
      destination_account: xrplAddressSchema.describe('Receiver'),
      destination_amount: xrplAssetAmountSchema.describe('Amount the receiver should get'),
      send_max: xrplAssetAmountSchema.optional().describe('Maximum the sender is willing to spend'),
      source_currencies: z
        .array(xrplAssetSchema)
        .max(18)
        .optional()
        .describe('Currencies the sender may spend (default: all they hold)'),
      ...ledgerSpecifierShape,
    }),
  }),
  outputSchema: xrplMethodResponse({
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
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData
    const { destination_amount, send_max, source_currencies, ...rest } = request

    return await executeMethod({
      network,
      request: {
        ...rest,
        destination_amount: encodeCurrencyCodes(destination_amount),
        ...(send_max && { send_max: encodeCurrencyCodes(send_max) }),
        ...(source_currencies && { source_currencies: source_currencies.map(encodeCurrencyCodes) }),
        command: 'ripple_path_find',
      } as Request,
      logMessage: 'Ripple path find request',
      mastra,
    })
  },
})
