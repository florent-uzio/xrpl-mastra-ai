import { ToolExecutionContext } from '@mastra/core'
import { SubmittableTransaction, TxResponse, Wallet } from 'xrpl'
import { disconnectXrplClient, getXrplClient } from '../../../../helpers'

type SubmitTransactionProps<T extends SubmittableTransaction> = {
  // The network to use
  network: string
  // The mastra instance to use
  mastra?: ToolExecutionContext['mastra']
} & (
  | {
      // The transaction to submit
      txn: T
      // The signature to use for the transaction
      signature?: never
      // The seed to construct the wallet from
      seed: string
    }
  | {
      // The transaction to submit
      txn?: never
      // The signature to use for the transaction
      signature: string
      // The seed to construct the wallet from
      seed?: never
    }
)

/**
 * Submit a transaction to the XRPL network
 * @param props - The properties to use
 * @param props.network - The network to use
 * @param props.txn - The transaction to submit
 * @param props.seed - The seed to construct the wallet from
 * @returns The response from the XRPL network
 */
export const submitTransaction = async <T extends SubmittableTransaction>({
  mastra,
  network,
  txn,
  seed,
  signature,
}: SubmitTransactionProps<T>): Promise<TxResponse<T | SubmittableTransaction>> => {
  const logger = mastra?.getLogger()

  // Get or create an XRPL client instance for the specified network
  // This handles singleton pattern and connection management
  const client = await getXrplClient(network, mastra)

  // Submit the transaction to the XRPL network
  try {
    if (seed && txn) {
      logger?.info('Submitting transaction with seed', { txn, seed })

      return await client.submitAndWait(txn, {
        autofill: true,
        wallet: Wallet.fromSeed(seed),
      })
    }

    if (signature) {
      logger?.info('Submitting transaction with signature', { signature })

      return await client.submitAndWait(signature)
    }

    throw new Error('No transaction or signature provided to submit')
  } finally {
    // Clean up: Disconnect the XRPL client to free up network resources
    // This is important for resource management and preventing connection leaks
    await disconnectXrplClient(network, mastra)
  }
}
