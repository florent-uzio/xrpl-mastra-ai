import { createTool } from '@mastra/core/tools'
import { SubmittableTransaction } from 'xrpl'
import z from 'zod'

type CreateToolConfig = Parameters<typeof createTool>[0]

/**
 * Configuration for creating a transaction tool
 */
export type TransactionToolConfig<T extends SubmittableTransaction, S extends FactorySchema> = {
  /** The tool ID (e.g., 'submit-payment', 'submit-account-set') */
  toolId: string
  /** Detailed description of the transaction and its fields */
  description: string
  /** Function to build the transaction object from input parameters */
  buildTransaction: (params: z.infer<S['inputSchema']>) => T
  /** Optional function to validate transaction before submission */
  validateTransaction?: (txn: T) => void | Promise<void>
} & Omit<CreateToolConfig, 'id' | 'inputSchema' | 'execute'>

/**
 * Output schema shared by all transaction tools (the submitAndWait response).
 * Fields are optional and extra fields are kept, so a valid response is never rejected.
 */
export const transactionResponseSchema = z.looseObject({
  id: z.union([z.string(), z.number()]).optional(),
  type: z.string().optional(),
  result: z.looseObject({
    hash: z.string().optional().describe('Transaction hash'),
    validated: z.boolean().optional().describe('true once the transaction is in a validated (final) ledger'),
    ledger_index: z.number().optional().describe('Ledger the transaction was included in'),
    meta: z
      .union([
        z.string(),
        z.looseObject({
          TransactionResult: z
            .string()
            .optional()
            .describe('tesSUCCESS = applied. tec* = included but failed (fee charged). Anything else = not applied'),
          delivered_amount: z.unknown().optional().describe('Amount actually delivered (Payment)'),
        }),
      ])
      .optional(),
  }),
})

/**
 * Common input schema for all transaction tools
 */
export const baseTransactionSchema = z.object({
  network: z.string().describe('Network to submit the transaction to, e.g. "wss://s.altnet.rippletest.net:51233"'),
  seed: z.string().optional().describe('Seed phrase for the account on testnet or devnet, never mainnet'),
  signature: z
    .string()
    .optional()
    .describe(
      'Signature for the transaction, typically provided for mainnet but can also be used for testnet or devnet',
    ),
})

/**
 * This is a schema for the input schema of the transaction tool factory
 */
export const factorySchema = z.object({
  inputSchema: z.instanceof(z.ZodObject).describe('The input schema for the transaction tool'),
})

export type FactorySchema = z.infer<typeof factorySchema>
