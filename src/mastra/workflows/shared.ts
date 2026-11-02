import { ToolExecutionContext } from '@mastra/core/tools'
import { SubmittableTransaction, TransactionMetadata, TxResponse, Wallet } from 'xrpl'
import z from 'zod'
import { getXrplClient, LedgerClient, submit } from '../../helpers'

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

/**
 * Submits a transaction signed by `wallet` and throws unless it succeeded: a workflow cannot go on after a failed
 * transaction (a tec result is validated but failed, so later steps would build on something that does not exist).
 */
export const submitStep = async <T extends SubmittableTransaction>(
  client: LedgerClient,
  tx: T,
  wallet: Wallet,
  description: string,
): Promise<{ result: TxnResult; response: TxResponse<T> }> => {
  const { ok, engineResult, hash, response } = await submit(client, tx, { wallet })
  if (!ok) {
    throw new Error(`${description} failed with ${engineResult} (${hash})`)
  }
  return { result: { description, hash, status: engineResult }, response }
}

/** Reads the ID of the ledger entry of `type` (e.g. "Vault") that a transaction created, from its metadata. */
export const createdEntryId = (response: TxResponse, type: string): string => {
  const { AffectedNodes } = response.result.meta as TransactionMetadata
  for (const node of AffectedNodes) {
    if ('CreatedNode' in node && node.CreatedNode.LedgerEntryType === type) {
      return node.CreatedNode.LedgerIndex
    }
  }
  throw new Error(`No ${type} created by ${response.result.hash}`)
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
