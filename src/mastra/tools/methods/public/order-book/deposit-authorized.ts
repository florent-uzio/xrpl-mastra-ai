import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getDepositAuthorizedTool = createTool({
  id: 'get-deposit-authorized',
  description: `Check whether a source account may send payments to a destination account that uses Deposit Authorization. deposit_authorized is true if the destination has not enabled it, the source is preauthorized, or the source holds one of the supplied accepted credentials.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      source_account: xrplAddressSchema.describe('Sender'),
      destination_account: xrplAddressSchema.describe('Receiver'),
      credentials: z
        .array(z.string().length(64))
        .optional()
        .describe('Credential ledger entry IDs the sender presents'),
      ...ledgerSpecifierShape,
    }),
  }),
  outputSchema: xrplMethodResponse({
    deposit_authorized: z.boolean().optional(),
    source_account: z.string().optional(),
    destination_account: z.string().optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'deposit_authorized' },
      logMessage: 'Deposit authorized request',
      mastra,
    })
  },
})
