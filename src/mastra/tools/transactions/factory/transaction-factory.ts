import { createTool } from '@mastra/core/tools'
import { SubmittableTransaction } from 'xrpl'
import { z } from 'zod'
import { submitTransaction } from '../shared/transaction'
import { baseTransactionSchema, FactorySchema, TransactionToolConfig } from './transaction-factory.types'

/**
 * Creates a complete transaction schema by merging base fields with transaction-specific fields
 * and adding validation to ensure either seed or signature is provided
 */
const createCompleteTransactionSchema = <S extends FactorySchema>(params: S) => {
  return baseTransactionSchema
    .merge(z.object({ txn: params.inputSchema }))
    .refine(data => data.seed !== undefined || data.signature !== undefined, {
      message: 'Either seed or signature must be provided for transaction authentication',
      path: ['seed', 'signature'],
    })
}

/**
 * Factory function that creates transaction tools with consistent base functionality
 *
 * @param params - Configuration containing the input schema for the transaction
 * @returns An object with createTransactionTool method
 *
 * @example
 * ```typescript
 * const { createTransactionTool } = useTransactionToolFactory({
 *   inputSchema: paymentSchema
 * })
 *
 * const paymentTool = createTransactionTool({
 *   toolId: 'submit-payment',
 *   description: 'Submit a payment transaction',
 *   buildTransaction: (params) => ({ ... }),
 * })
 * ```
 */
export const useTransactionToolFactory = <S extends FactorySchema>(params: S) => {
  // Create the complete schema with validation
  const completeSchema = createCompleteTransactionSchema(params)

  /**
   * Creates a transaction tool with the specified configuration
   */
  const createTransactionTool = <T extends SubmittableTransaction>(config: TransactionToolConfig<T, S>) => {
    return createTool({
      ...config,
      id: config.toolId,
      inputSchema: completeSchema,
      execute: async ({ context, mastra }) => {
        if (!context) {
          throw new Error('Context not found - ensure the tool is called with proper context')
        }

        const { txn, ...rest } = context

        // Build the transaction object from input parameters
        const builtTxn = config.buildTransaction(txn as z.infer<S['inputSchema']>)

        // Run optional validation if provided
        if (config.validateTransaction) {
          await config.validateTransaction(builtTxn)
        }

        // Submit the transaction using the appropriate
        return await submitTransaction<T>({
          mastra,
          txn: builtTxn,
          ...rest,
        })
      },
    })
  }

  return {
    createTransactionTool,
  }
}
