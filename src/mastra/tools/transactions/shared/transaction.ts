import { ToolExecutionContext } from '@mastra/core/tools'
import { SubmittableTransaction, TxResponse, Wallet } from 'xrpl'
import { assertSeedAllowed, getXrplClient } from '../../../../helpers'

type SubmitTransactionProps<T extends SubmittableTransaction> = {
  // The network to use
  network: string
  // The mastra instance to use
  mastra?: ToolExecutionContext['mastra']
  // The transaction to submit
  txn: T
  // The signature to use for the transaction
  signature?: string
  // The seed to construct the wallet from
  seed?: string
}

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
}: SubmitTransactionProps<T>): Promise<TxResponse<T>> => {
  const logger = mastra?.getLogger()

  // Before any connection: a seed must never reach a node that is not a test network
  if (seed) assertSeedAllowed(network)

  // Get or create an XRPL client instance for the specified network
  // This handles singleton pattern and connection management
  const client = await getXrplClient(network, mastra)

  // Submit the transaction to the XRPL network
  if (signature) {
    logger?.info('Submitting transaction with signature', { signature })

    // For signature-based submission, we can't know the exact transaction type
    // So we cast to the generic type T
    return (await client.submitAndWait(signature)) as TxResponse<T>
  }

  if (seed) {
    logger?.info('Submitting transaction with seed', { txn })

    return await client.submitAndWait(txn, {
      autofill: true,
      wallet: Wallet.fromSeed(seed),
    })
  }

  throw new Error('No transaction or signature provided to submit')
}
