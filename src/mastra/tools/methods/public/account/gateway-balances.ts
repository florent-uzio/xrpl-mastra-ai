import { z } from 'zod'
import { ledgerSpecifierShape, xrplAddressSchema } from '../../../../../helpers'
import { defineMethodTool } from '../../shared'

export const getGatewayBalancesTool = defineMethodTool({
  id: 'get-gateway-balances',
  command: 'gateway_balances',
  description: `Calculate the total tokens an issuer account has issued (obligations), optionally excluding operational "hot wallet" addresses. Some public servers disable this method.

Response: obligations (issued to non-hotwallet holders), balances (held by the hotwallets), assets (issued by others and held by this account).`,
  request: z.object({
    account: xrplAddressSchema.describe('Issuer address'),
    hotwallet: z
      .union([xrplAddressSchema, z.array(xrplAddressSchema)])
      .optional()
      .describe('Operational address(es) to exclude from obligations'),
    ...ledgerSpecifierShape,
  }),
  result: {
    account: z.string().optional(),
    obligations: z.record(z.string(), z.string()).optional().describe('Issued tokens by currency, as decimal strings'),
    balances: z.record(z.string(), z.array(z.looseObject({ currency: z.string(), value: z.string() }))).optional(),
    assets: z.record(z.string(), z.array(z.looseObject({ currency: z.string(), value: z.string() }))).optional(),
  },
})
