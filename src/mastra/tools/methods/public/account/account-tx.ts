import { z } from 'zod'
import { ledgerSpecifierShape, paginationMarkerSchema, xrplAddressSchema } from '../../../../../helpers'
import { defineMethodTool } from '../../shared'

export const getAccountTxTool = defineMethodTool({
  id: 'get-account-tx',
  command: 'account_tx',
  description: `Get validated transaction history for an account. ledger_index/ledger_hash select a single ledger: do not combine them with ledger_index_min/max.`,
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
  result: {
    account: z.string().optional(),
    transactions: z.array(z.looseObject({ validated: z.boolean().optional() })).optional(),
  },
})
