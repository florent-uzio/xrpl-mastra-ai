import { z } from 'zod'
import { ledgerSpecifierShape, paginationMarkerSchema } from '../../../../../helpers'
import { defineMethodTool } from '../../shared'

export const getLedgerTool = defineMethodTool({
  id: 'get-ledger',
  command: 'ledger',
  description: `Get a ledger's header and, optionally, its transactions. Use it for ledger close time, hash, parent hash and totals. Set transactions true to list transactions (hashes only unless expand is true). Full ledger state dumps are not supported here: use get-ledger-data.`,
  request: z.object({
    ...ledgerSpecifierShape,
    transactions: z.boolean().optional().describe("Include the ledger's transactions (default false)"),
    expand: z.boolean().optional().describe('With transactions: return full transaction objects, not just hashes'),
    owner_funds: z.boolean().optional().describe('With expand: add owner_funds to OfferCreate transactions'),
  }),
  result: {
    ledger: z
      .looseObject({
        ledger_index: z.union([z.string(), z.number()]).optional(),
        ledger_hash: z.string().optional(),
        parent_hash: z.string().optional(),
        close_time: z.number().optional().describe('Seconds since the Ripple Epoch (2000-01-01)'),
        close_time_human: z.string().optional(),
        total_coins: z.string().optional().describe('Total XRP in drops'),
        closed: z.boolean().optional(),
        transactions: z.array(z.unknown()).optional(),
      })
      .optional(),
    ledger_hash: z.string().optional(),
  },
})

export const getLedgerClosedTool = defineMethodTool({
  id: 'get-ledger-closed',
  command: 'ledger_closed',
  description: `Get the hash and index of the latest closed ledger (not necessarily validated).`,
  request: z.object({}),
  result: {
    ledger_hash: z.string().optional(),
    ledger_index: z.number().optional(),
  },
})

export const getLedgerCurrentTool = defineMethodTool({
  id: 'get-ledger-current',
  command: 'ledger_current',
  description: `Get the index of the current open ledger (the one still collecting transactions; its contents are not final).`,
  request: z.object({}),
  result: {
    ledger_current_index: z.number().optional(),
  },
})

export const getLedgerDataTool = defineMethodTool({
  id: 'get-ledger-data',
  command: 'ledger_data',
  description: `Page through the raw ledger entries (state data) of one ledger. Large: always set limit and follow marker for more. Filter with type to avoid scanning everything. Prefer account-specific tools when you know the account.`,
  request: z.object({
    ...ledgerSpecifierShape,
    binary: z.boolean().optional().describe('Return hex blobs instead of JSON'),
    limit: z.number().int().positive().max(2048).optional().describe('Max entries per page'),
    type: z
      .string()
      .optional()
      .describe('Only this ledger entry type, e.g. "account", "amm", "check", "escrow", "offer", "state" (trust line)'),
    marker: paginationMarkerSchema,
  }),
  result: {
    ledger_hash: z.string().optional(),
    state: z.array(z.looseObject({ index: z.string().optional() })).optional(),
  },
})
