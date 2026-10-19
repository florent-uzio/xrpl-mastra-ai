import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, paginationMarkerSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getAccountLinesTool = createTool({
  id: 'get-account-lines',
  description: `Get an account's trust lines (issued-currency token balances and limits).

Trust lines only: this does NOT return Multi-Purpose Token (MPT) balances. MPT holdings are MPToken ledger objects; read them with get-account-objects using type "mptoken" (the balance is the MPToken's MPTAmount).

Each line has balance (positive: the account holds tokens; negative: the account owes them), limit, limit_peer, and freeze/auth/no_ripple flags.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      account: xrplAddressSchema.describe('Account address'),
      peer: xrplAddressSchema.optional().describe('Only lines with this counterparty address'),
      ...ledgerSpecifierShape,
      limit: z.number().int().min(10).max(400).optional().describe('Max results per page (10-400, default 200).'),
      marker: paginationMarkerSchema,
    }),
  }),
  outputSchema: xrplMethodResponse({
    account: z.string().optional(),
    lines: z
      .array(
        z.looseObject({
          account: z.string().describe('Counterparty (usually the issuer)'),
          balance: z.string().describe('Positive: the account holds tokens; negative: it owes them'),
          currency: z.string().describe('3-letter or 40-character hex code'),
          limit: z.string(),
          limit_peer: z.string(),
        }),
      )
      .optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the account_lines command
    return await executeMethod({
      network,
      request: {
        ...request,
        command: 'account_lines',
      },
      logMessage: 'Account lines request',
      mastra,
    })
  },
})
