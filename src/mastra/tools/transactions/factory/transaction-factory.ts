import { createTool } from '@mastra/core/tools'
import { SubmittableTransaction, TxResponse } from 'xrpl'
import { z } from 'zod'
import { submitTransaction } from '../shared/transaction'
import { baseTransactionSchema, FactorySchema, TransactionToolConfig } from './transaction-factory.types'

export const useTransactionToolFactory = <S extends FactorySchema>(params: S) => {
  // Merge the base transaction schema with the input schema
  const schema = baseTransactionSchema
    .merge(z.object({ txn: params.inputSchema }))
    .refine(data => data.seed !== undefined || data.signature !== undefined, {
      message: 'Either seed or signature must be provided',
      path: ['seed', 'signature'],
    })

  const createTransactionTool = <T extends SubmittableTransaction>(config: TransactionToolConfig<T, S>) => {
    return createTool({
      ...config,
      id: config.toolId,
      inputSchema: schema,
      execute: async ({ context, mastra }) => {
        if (!context) throw new Error('Context not found')

        const { network, seed, signature, txn } = context

        const builtTxn = config.buildTransaction(txn as z.infer<S['inputSchema']>)

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
