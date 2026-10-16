import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, paginationMarkerSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod } from '../../shared'

export const getAccountTxTool = createTool({
  id: 'get-account-tx',
  description: `Get validated transaction history for an account. ledger_index/ledger_hash select a single ledger: do not combine them with ledger_index_min/max.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      account: xrplAddressSchema.describe('Account address'),
      tx_type: z.string().optional().describe('Only this transaction type, e.g. "Payment" (Clio servers only)'),
      ledger_index_min: z.number().int().optional().describe('Earliest ledger to search, -1 for earliest available'),
      ledger_index_max: z.number().int().optional().describe('Latest ledger to search, -1 for latest available'),
      ...ledgerSpecifierShape,
      binary: z.boolean().optional().describe('Return hex instead of JSON'),
      forward: z.boolean().optional().describe('Oldest first'),
      limit: z.number().int().positive().optional().describe('Max results per page; the server may ignore it'),
      marker: paginationMarkerSchema,
    }),
  }),
  execute: async (inputData, { mastra }) => {
    // Extract network and options from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the account_tx command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_tx' },
      logMessage: 'Account Tx request',
      mastra,
    })
  },
})
