import { ToolExecutionContext } from '@mastra/core/tools'
import { SubmittableTransaction, TransactionMetadata, TxResponse, Wallet } from 'xrpl'
import z from 'zod'
import { getXrplClient, LedgerClient, submit, toWalletRecord, WalletRecord } from '../../helpers'

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

/**
 * A wallet as carried from step to step: plain JSON, because Mastra saves every step's output in a snapshot and a
 * Wallet instance would come back from it as a plain object. Each step signs with Wallet.fromSeed.
 */
/**
 * Fields every workflow result ends with. Results carry addresses only: seeds stay in the record file
 * (get-flow-records), so they never reach the model or an MCP client by default.
 */
export const resultShape = {
  network: z.string(),
  txnResults: z.array(txnResultSchema).describe('Transactions of the run'),
  recordId: z.string().describe('Id of the saved record, usable with the get-flow-records tool (it holds the seeds)'),
  recordPath: z.string().describe('Path of the saved record file'),
}

export const addressSchema = z.string().describe('Classic address')

export const walletRecordSchema = z.object({
  address: z.string().describe('Classic address'),
  seed: z.string().describe('Seed (test networks only)'),
})

// Crypto errors in the confidential workflow can be plain objects: show them instead of "Unknown error"
export { errorMessage } from '../../helpers'

/**
 * Submits a transaction signed by `signer` and throws unless it succeeded: a workflow cannot go on after a failed
 * transaction (a tec result is validated but failed, so later steps would build on something that does not exist).
 */
export const submitStep = async <T extends SubmittableTransaction>(
  client: LedgerClient,
  tx: T,
  signer: WalletRecord,
  description: string,
): Promise<{ result: TxnResult; response: TxResponse<T> }> => {
  const { ok, engineResult, hash, response } = await submit(client, tx, { wallet: Wallet.fromSeed(signer.seed) })
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
): Promise<WalletRecord[]> => {
  const client = await getXrplClient(network, mastra)
  return Promise.all(Array.from({ length: count }, async () => toWalletRecord((await client.fundWallet()).wallet)))
}
