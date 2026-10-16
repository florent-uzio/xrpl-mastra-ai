import { Batch, BatchFlags, combineBatchSigners, decode, GlobalFlags, signMultiBatch, Wallet } from 'xrpl'
import { getXrplClient } from '../../../../helpers'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplBatchSchema } from './batch.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplBatchSchema,
})

const MODE_FLAGS = [
  BatchFlags.tfAllOrNothing,
  BatchFlags.tfOnlyOne,
  BatchFlags.tfUntilFailure,
  BatchFlags.tfIndependent,
]

/** Recursively converts the currency code of every amount/asset object to hex */
const encodeDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(encodeDeep)
  }

  if (typeof value === 'object' && value !== null) {
    const encoded = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, encodeDeep(entry)]))
    return encodeCurrencyCodes(encoded)
  }

  return value
}

export const submitBatchTool = createTransactionTool<Batch>({
  toolId: 'submit-batch',
  description: `Submit a Batch transaction: 2-8 inner transactions executed atomically per the chosen mode. Requires the Batch amendment.

Flags must be exactly ONE mode: tfAllOrNothing 65536 (all succeed or none apply), tfOnlyOne 131072 (apply the first success only), tfUntilFailure 262144 (apply in order until the first failure), tfIndependent 524288 (apply each regardless of failures).

RawTransactions: inner transactions with their normal fields (currency codes are hex-encoded automatically). tfInnerBatchTxn is added automatically; Fee, signing fields and Sequence are autofilled. Do not set Fee, SigningPubKey, TxnSignature or Signers on inner transactions. Nested Batch is not allowed.

Multi-account: inner accounts other than the outer Account must sign. On testnet/devnet pass their seeds in innerSeeds and the BatchSigners are created automatically. On mainnet BatchSigners must be supplied pre-signed.

Errors: temINVALID_FLAG (zero or several modes), temARRAY_EMPTY/temARRAY_TOO_LARGE, temINVALID_INNER_BATCH, tefBAD_AUTH (missing BatchSigners).`,
  buildTransaction: ({ RawTransactions, innerSeeds: _innerSeeds, ...batch }) => {
    return {
      ...batch,
      RawTransactions: RawTransactions.map(({ RawTransaction }) => ({
        RawTransaction: {
          ...(encodeDeep(RawTransaction) as typeof RawTransaction),
          Flags: ((RawTransaction.Flags as number | undefined) ?? 0) | GlobalFlags.tfInnerBatchTxn,
        },
      })),
    } as Batch
  },
  validateTransaction: batch => {
    const modes = MODE_FLAGS.filter(flag => ((batch.Flags as number | undefined) ?? 0) & flag)

    if (modes.length !== 1) {
      throw new Error(
        'Flags must set exactly one Batch mode: tfAllOrNothing, tfOnlyOne, tfUntilFailure or tfIndependent',
      )
    }

    if (batch.RawTransactions.some(({ RawTransaction }) => RawTransaction.TransactionType === 'Batch')) {
      throw new Error('Nested Batch transactions are not allowed')
    }
  },
  prepareTransaction: async ({ txn, input, network, mastra }) => {
    const innerWallets = (input.innerSeeds ?? []).map(seed => Wallet.fromSeed(seed))
    const signers = innerWallets.filter(wallet => wallet.classicAddress !== txn.Account)

    if (signers.length === 0) {
      return txn
    }

    // Sequences and fees must be filled before signing because the signature covers the inner transaction hashes
    const client = await getXrplClient(network, mastra)
    const prepared = await client.autofill(txn, signers.length)

    const signedCopies = signers.map(wallet => {
      const copy = structuredClone(prepared)
      signMultiBatch(wallet, copy)
      return copy
    })

    return decode(combineBatchSigners(signedCopies)) as unknown as Batch
  },
})
