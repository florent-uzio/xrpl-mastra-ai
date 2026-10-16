import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getGatewayBalancesTool = createTool({
  id: 'get-gateway-balances',
  description: `Calculate the total tokens an issuer account has issued (obligations), optionally excluding operational "hot wallet" addresses. Some public servers disable this method.

Response: obligations (issued to non-hotwallet holders), balances (held by the hotwallets), assets (issued by others and held by this account).`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      account: xrplAddressSchema.describe('Issuer address'),
      hotwallet: z
        .union([xrplAddressSchema, z.array(xrplAddressSchema)])
        .optional()
        .describe('Operational address(es) to exclude from obligations'),
      ...ledgerSpecifierShape,
    }),
  }),
  outputSchema: xrplMethodResponse({
    account: z.string().optional(),
    obligations: z.record(z.string(), z.string()).optional().describe('Issued tokens by currency, as decimal strings'),
    balances: z.record(z.string(), z.array(z.looseObject({ currency: z.string(), value: z.string() }))).optional(),
    assets: z.record(z.string(), z.array(z.looseObject({ currency: z.string(), value: z.string() }))).optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    // Extract network and options from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the gateway_balances command
    return await executeMethod({
      network,
      request: { ...request, command: 'gateway_balances' },
      logMessage: 'Gateway balances request',
      mastra,
    })
  },
})
