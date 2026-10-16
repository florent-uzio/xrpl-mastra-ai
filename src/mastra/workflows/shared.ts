import { ToolExecutionContext } from '@mastra/core/tools'
import { TxResponse, Wallet } from 'xrpl'
import z from 'zod'
import { getXrplClient } from '../../helpers'

/**
 * Supported network endpoints for the issuance workflows
 *
 * These are the WebSocket URLs for different XRPL networks.
 * The workflows are designed primarily for testnet and devnet networks (faucet funding, seeds saved in records).
 */
export const workflowNetworkSchema = z.enum([
  // Testnet networks
  'wss://s.altnet.rippletest.net:51233/',
  'wss://testnet.xrpl-labs.com/',
  // Devnet networks
  'wss://clio.devnet.rippletest.net:51233/',
  'wss://s.devnet.rippletest.net:51233/',
])

/**
 * Transaction result schema
 *
 * Represents the result of a single XRPL transaction with
 * description, hash, and status information.
 */
export const txnResultSchema = z.object({
  description: z.string().describe('Human-readable description of the transaction'),
  hash: z.string().describe('Transaction hash for blockchain verification'),
  status: z.string().describe('Transaction status (success, failure, etc.)'),
})

export type TxnResult = z.infer<typeof txnResultSchema>

export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error')

export const toTxnResult = (description: string, response: TxResponse): TxnResult => ({
  description,
  hash: response.result.hash,
  // @ts-expect-error - TransactionResult is an object here
  status: response.result.meta.TransactionResult ?? 'N/A',
})

/** submitAndWait does not throw when a transaction is validated with a tec code, so check it explicitly. */
export const assertTxnSuccess = (result: TxnResult) => {
  if (result.status !== 'tesSUCCESS') {
    throw new Error(`${result.description} failed with ${result.status} (${result.hash})`)
  }
  return result
}

/** Funds `count` new wallets from the faucet, in parallel. */
export const fundWallets = async (
  network: string,
  count: number,
  mastra: ToolExecutionContext['mastra'],
): Promise<Wallet[]> => {
  const client = await getXrplClient(network, mastra)
  return Promise.all(Array.from({ length: count }, async () => (await client.fundWallet()).wallet))
}
