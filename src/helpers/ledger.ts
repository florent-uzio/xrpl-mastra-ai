import { Client, SubmittableTransaction, TxResponse, Wallet } from 'xrpl'
import { assertSeedAllowed } from './test-networks'

/**
 * Ledger submission: the one place that autofills, signs and submits transactions, for tools and workflows alike.
 */

/** The part of xrpl's Client this module uses: the real Client in production, a fake in tests. */
export type LedgerClient = Pick<Client, 'url' | 'submitAndWait' | 'autofill'>

/** Who signs: a wallet held here (test networks only), or a blob already signed elsewhere. */
export type Signer = { wallet: Wallet } | { signedBlob: string }

export type SubmitResult<T extends SubmittableTransaction = SubmittableTransaction> = {
  /** true only for tesSUCCESS in a validated ledger */
  ok: boolean
  /** TransactionResult, e.g. tesSUCCESS or tecNO_LINE. A tec result is final: the fee is charged, never retry. */
  engineResult: string
  hash: string
  validated: boolean
  response: TxResponse<T>
}

/** autofill fills Sequence whenever it is missing, even when a Ticket is used: it must be 0 then. */
const withTicketSequence = <T extends SubmittableTransaction>(tx: T): T =>
  tx.TicketSequence !== undefined && tx.Sequence === undefined ? { ...tx, Sequence: 0 } : tx

/** Fills Fee, Sequence and LastLedgerSequence without signing. `signersCount` adds the fee of multi-signers. */
export const autofill = <T extends SubmittableTransaction>(client: LedgerClient, tx: T, signersCount?: number) =>
  client.autofill(withTicketSequence(tx), signersCount)

/**
 * Submits a transaction and waits for its validated result. Never throws because of a tec result:
 * check `ok`. With `signedBlob`, `tx` is ignored and the blob is submitted as is.
 */
export const submit = async <T extends SubmittableTransaction>(
  client: LedgerClient,
  tx: T,
  signer: Signer,
): Promise<SubmitResult<T>> => {
  let response: TxResponse<T>

  if ('signedBlob' in signer) {
    response = (await client.submitAndWait(signer.signedBlob)) as TxResponse<T>
  } else {
    // A wallet can sign anything: refuse before anything is sent to a network that is not a test network
    assertSeedAllowed(client.url)
    response = await client.submitAndWait(withTicketSequence(tx), { autofill: true, wallet: signer.wallet })
  }

  const { meta, hash, validated = false } = response.result
  const engineResult = (typeof meta === 'object' && meta?.TransactionResult) || 'unknown'

  return { ok: validated && engineResult === 'tesSUCCESS', engineResult, hash, validated, response }
}
