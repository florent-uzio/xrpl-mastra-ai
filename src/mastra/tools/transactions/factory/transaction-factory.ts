import { createTool } from '@mastra/core/tools'
import { SubmittableTransaction, TxResponse } from 'xrpl'
import { z } from 'zod'
import { submitTransaction } from '../shared/transaction'

type CreateToolConfig = Parameters<typeof createTool>[0]
type InputSchemaTxn = z.ZodObject<any>

/**
 * Configuration for creating a transaction tool
 */
export type TransactionToolConfig<T extends SubmittableTransaction, S extends InputSchemaTxn = z.ZodObject<any>> = {
  /** The transaction type name (e.g., 'Payment', 'AccountSet') */
  transactionType: T['TransactionType']
  /** The tool ID (e.g., 'submit-payment', 'submit-account-set') */
  toolId: string
  /** Detailed description of the transaction and its fields */
  description: string
  /** Function to build the transaction object from input parameters */
  buildTransaction: (params: z.infer<S>) => T
  /** Optional function to validate transaction before submission */
  validateTransaction?: (txn: T) => void | Promise<void>
  /** Optional function to transform the response */
  // transformResponse?: (response: TxResponse<T>) => any
} & Omit<CreateToolConfig, 'id' | 'inputSchema' | 'execute'>

/**
 * Common input schema for all transaction tools
 */
export const baseTransactionSchema = z.object({
  network: z.string(),
  seed: z.string().optional(),
  signature: z.string().optional(),
})

export const useTransactionToolFactory = <S extends InputSchemaTxn>(inputSchema: S) => {
  // Merge the base transaction schema with the input schema
  const schema = baseTransactionSchema.merge(z.object({ txn: inputSchema }))

  const createTransactionTool = <T extends SubmittableTransaction>(config: TransactionToolConfig<T, S>) => {
    return createTool({
      ...config,
      id: config.toolId,
      inputSchema: schema,
      execute: async ({ context, mastra }) => {
        if (!context) throw new Error('Context not found')

        const { network, seed, signature, txn } = context

        const builtTxn = config.buildTransaction(txn as z.infer<S>)

        if (config.validateTransaction) await config.validateTransaction(builtTxn)

        let response: TxResponse<T>

        if (signature) {
          response = await submitTransaction<T>({
            mastra,
            network,
            signature,
          })
          return response
        } else if (seed) {
          response = await submitTransaction<T>({
            mastra,
            network,
            txn: builtTxn,
            seed,
          })
          return response
        }

        throw new Error('No signature or seed provided')
      },
    })
  }
  return {
    createTransactionTool,
  }
}
