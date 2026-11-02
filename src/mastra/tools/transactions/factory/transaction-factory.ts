import { createTool } from '@mastra/core/tools'
import { SubmittableTransaction, Wallet } from 'xrpl'
import { z } from 'zod'
import { assertSeedAllowed, getXrplClient, submit } from '../../../../helpers'
import { encodeCurrencyCodesDeep } from '../shared/asset'
import {
  baseTransactionSchema,
  FactorySchema,
  TransactionToolConfig,
  transactionResponseSchema,
} from './transaction-factory.types'

/** Creates a complete transaction schema by merging base fields (network, seed) with transaction-specific fields */
const createCompleteTransactionSchema = <S extends FactorySchema>(params: S) =>
  baseTransactionSchema.extend({ txn: params.inputSchema })

/**
 * Builds the transaction from the tool input, converts every currency code to hex (at any depth: Amount, SendMax,
 * Paths, LimitAmount, Asset, ...) and validates it. Everything a tool does before signing, without a network.
 */
const buildSubmittable = async <T extends SubmittableTransaction, S extends FactorySchema>(
  config: Pick<TransactionToolConfig<T, S>, 'buildTransaction' | 'validateTransaction'>,
  txn: z.infer<S['inputSchema']>,
): Promise<T> => {
  const built = config.buildTransaction ? config.buildTransaction(txn) : (txn as unknown as T)
  const encoded = encodeCurrencyCodesDeep(built)

  await config.validateTransaction?.(encoded)

  return encoded
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

        const { txn, network, seed } = inputData
        const input = txn as z.infer<S['inputSchema']>

        let builtTxn = await buildSubmittable(config, input)

        if (config.prepareTransaction) {
          builtTxn = await config.prepareTransaction({ txn: builtTxn, input, network, mastra })
        }

        // Fail before opening a socket: a seed must never reach a node that is not a test network
        assertSeedAllowed(network)

        const client = await getXrplClient(network, mastra)
        mastra?.getLogger()?.info('Submitting transaction', { network, txn: builtTxn })

        const { ok, engineResult, response } = await submit(client, builtTxn, { wallet: Wallet.fromSeed(seed) })

        // xrpl's response types have no index signature, so they don't match the loose output schema structurally
        return { ...response, ok, engine_result: engineResult } as unknown as z.infer<typeof transactionResponseSchema>
      },
    })
  }

  return {
    createTransactionTool,
  }
}
