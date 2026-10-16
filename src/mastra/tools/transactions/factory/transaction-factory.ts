import { createTool } from '@mastra/core/tools'
import { SubmittableTransaction } from 'xrpl'
import { z } from 'zod'
import { submitTransaction } from '../shared/transaction'
import {
  baseTransactionSchema,
  FactorySchema,
  TransactionToolConfig,
  transactionResponseSchema,
} from './transaction-factory.types'

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
      outputSchema: transactionResponseSchema,
      // The transaction is already submitted when the result is validated: never turn it into an error (the model would retry)
      outputValidation: 'warn',
      execute: async (inputData, { mastra }) => {
        if (!inputData) {
          throw new Error('Input data not found - ensure the tool is called with proper input')
        }

        const { txn, ...rest } = inputData

        // Build the transaction object from input parameters
        let builtTxn = config.buildTransaction(txn as z.infer<S['inputSchema']>)

        // Run optional validation if provided
        if (config.validateTransaction) {
          await config.validateTransaction(builtTxn)
        }

        if (config.prepareTransaction) {
          builtTxn = await config.prepareTransaction({
            txn: builtTxn,
            input: txn as z.infer<S['inputSchema']>,
            network: rest.network,
            mastra,
          })
        }

        // Submit the transaction using the appropriate
        const response = await submitTransaction<T>({
          mastra,
          txn: builtTxn,
          ...rest,
        })

        // xrpl's response types have no index signature, so they don't match the loose output schema structurally
        return response as unknown as z.infer<typeof transactionResponseSchema>
      },
    })
  }

  return {
    createTransactionTool,
  }
}
