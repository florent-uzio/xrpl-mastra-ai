import { createTool } from '@mastra/core/tools'
import { Request } from 'xrpl'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, paginationMarkerSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getLedgerTool = createTool({
  id: 'get-ledger',
  description: `Get a ledger's header and, optionally, its transactions. Use it for ledger close time, hash, parent hash and totals. Set transactions true to list transactions (hashes only unless expand is true). Full ledger state dumps are not supported here: use get-ledger-data.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      ...ledgerSpecifierShape,
      transactions: z.boolean().optional().describe("Include the ledger's transactions (default false)"),
      expand: z.boolean().optional().describe('With transactions: return full transaction objects, not just hashes'),
      owner_funds: z.boolean().optional().describe('With expand: add owner_funds to OfferCreate transactions'),
    }),
  }),
  outputSchema: xrplMethodResponse({
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
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'ledger' },
      logMessage: 'Ledger request',
      mastra,
    })
  },
})

export const getLedgerClosedTool = createTool({
  id: 'get-ledger-closed',
  description: `Get the hash and index of the latest closed ledger (not necessarily validated).`,
  inputSchema: z.object({ network: networkSchema, request: z.object({}) }),
  outputSchema: xrplMethodResponse({
    ledger_hash: z.string().optional(),
    ledger_index: z.number().optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'ledger_closed' },
      logMessage: 'Ledger closed request',
      mastra,
    })
  },
})

export const getLedgerCurrentTool = createTool({
  id: 'get-ledger-current',
  description: `Get the index of the current open ledger (the one still collecting transactions; its contents are not final).`,
  inputSchema: z.object({ network: networkSchema, request: z.object({}) }),
  outputSchema: xrplMethodResponse({
    ledger_current_index: z.number().optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'ledger_current' },
      logMessage: 'Ledger current request',
      mastra,
    })
  },
})

export const getLedgerDataTool = createTool({
  id: 'get-ledger-data',
  description: `Page through the raw ledger entries (state data) of one ledger. Large: always set limit and follow marker for more. Filter with type to avoid scanning everything. Prefer account-specific tools when you know the account.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      ...ledgerSpecifierShape,
      binary: z.boolean().optional().describe('Return hex blobs instead of JSON'),
      limit: z.number().int().positive().max(2048).optional().describe('Max entries per page'),
      type: z
        .string()
        .optional()
        .describe(
          'Only this ledger entry type, e.g. "account", "amm", "check", "escrow", "offer", "state" (trust line)',
        ),
      marker: paginationMarkerSchema,
    }),
  }),
  outputSchema: xrplMethodResponse({
    ledger_hash: z.string().optional(),
    state: z.array(z.looseObject({ index: z.string().optional() })).optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'ledger_data' } as Request,
      logMessage: 'Ledger data request',
      mastra,
    })
  },
})
