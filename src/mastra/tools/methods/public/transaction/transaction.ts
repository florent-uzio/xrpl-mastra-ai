import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { networkSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

const txResultShape = {
  hash: z.string().optional(),
  validated: z.boolean().optional().describe('true if the outcome is final'),
  ledger_index: z.number().optional(),
  meta: z
    .looseObject({ TransactionResult: z.string().optional().describe('e.g. "tesSUCCESS"') })
    .optional()
    .describe('Metadata of the validated transaction, including its result and affected nodes'),
}

export const getTxTool = createTool({
  id: 'get-tx',
  description: `Look up a transaction by its hash: contents, validation status and metadata (result code "meta.TransactionResult", e.g. tesSUCCESS). If validated is false the outcome is not final yet. Use min_ledger/max_ledger to tell the server which range to search so it can answer "not found" definitively.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      transaction: z.string().length(64).describe('64-character hex transaction hash'),
      binary: z.boolean().optional().describe('Return hex instead of JSON'),
      min_ledger: z.number().int().nonnegative().optional().describe('Earliest ledger to search'),
      max_ledger: z.number().int().nonnegative().optional().describe('Latest ledger to search'),
    }),
  }),
  outputSchema: xrplMethodResponse(txResultShape),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'tx' },
      logMessage: 'Tx request',
      mastra,
    })
  },
})

export const getTransactionEntryTool = createTool({
  id: 'get-transaction-entry',
  description: `Look up a transaction by hash inside ONE specific ledger. Unlike get-tx, the ledger is required. Use get-tx unless you already know the ledger.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      tx_hash: z.string().length(64).describe('64-character hex transaction hash'),
      ledger_index: z
        .union([z.number().int().nonnegative(), z.enum(['validated', 'current', 'closed'])])
        .optional()
        .describe('Ledger sequence number or "validated"'),
      ledger_hash: z.string().length(64).optional().describe('Hash of the ledger containing the transaction'),
    }),
  }),
  outputSchema: xrplMethodResponse({
    tx_json: z.looseObject({}).optional(),
    metadata: z.looseObject({}).optional(),
    ledger_hash: z.string().optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'transaction_entry' },
      logMessage: 'Transaction entry request',
      mastra,
    })
  },
})
