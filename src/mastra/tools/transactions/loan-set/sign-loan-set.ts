import { createTool } from '@mastra/core/tools'
import { Client, LoanSet, signLoanSetByCounterparty, Wallet } from 'xrpl'
import { z } from 'zod'
import { assertSeedAllowed, getXrplClient } from '../../../../helpers'
import { xrplLoanSetSchema } from './loan-set.types'

type SignParams = {
  txn: z.infer<typeof xrplLoanSetSchema>
  seed: string
  counterpartySeed: string
}

/**
 * Autofills a LoanSet, signs it as Account, then adds the CounterpartySignature (made with the LoanSet
 * counterparty signing prefix). The autofilled Fee already covers the counterparty signature.
 */
export const signLoanSet = async (client: Client, { txn, seed, counterpartySeed }: SignParams) => {
  const wallet = Wallet.fromSeed(seed)
  const counterpartyWallet = Wallet.fromSeed(counterpartySeed)

  if (wallet.classicAddress !== txn.Account) {
    throw new Error(`The seed is for ${wallet.classicAddress}, not for Account ${txn.Account}`)
  }
  if (!txn.Counterparty) {
    throw new Error('Counterparty is required: the other party of the loan')
  }
  if (counterpartyWallet.classicAddress !== txn.Counterparty) {
    throw new Error(
      `The counterpartySeed is for ${counterpartyWallet.classicAddress}, not for Counterparty ${txn.Counterparty}`,
    )
  }

  const prepared = await client.autofill(txn as LoanSet)
  const first = wallet.sign(prepared)
  return signLoanSetByCounterparty(counterpartyWallet, first.tx_blob)
}

export const signLoanSetTool = createTool({
  id: 'sign-loan-set',
  description: `Sign a LoanSet as both parties (testnet/devnet only) and return the signed blob. Nothing is submitted.

A LoanSet needs two signatures: Account (broker owner or borrower) signs normally, and Counterparty adds a CounterpartySignature made with a dedicated signing prefix. submit-loan-set cannot make the second one, so use this tool to create a loan, then pass tx_blob to submit-signed-blob.

Input:
- network: websocket URL of a test network (seeds are refused on mainnet)
- txn: the LoanSet terms (same fields as submit-loan-set), with Account and Counterparty set. Do not set CounterpartySignature.
- seed: seed of Account
- counterpartySeed: seed of Counterparty

Output: the signed transaction, tx_blob and hash. Submit tx_blob with submit-signed-blob right away: LastLedgerSequence is set about 20 ledgers (~1 minute) ahead, after which the blob expires (tefMAX_LEDGER).

On mainnet, use prepare-loan-set: it returns the unsigned LoanSet for each party to sign outside this server, then the fully signed blob is submitted with submit-signed-blob.

The seeds are secrets: never repeat them.`,
  inputSchema: z.object({
    network: z.string().describe('Test network websocket URL, e.g. "wss://s.devnet.rippletest.net:51233"'),
    txn: xrplLoanSetSchema.describe('LoanSet terms, with Account and Counterparty set'),
    seed: z.string().describe('SECRET: seed of Account, testnet/devnet only'),
    counterpartySeed: z.string().describe('SECRET: seed of Counterparty, testnet/devnet only'),
  }),
  outputSchema: z.object({
    txn: z.looseObject({}).describe('Signed LoanSet, with TxnSignature and CounterpartySignature'),
    tx_blob: z.string().describe('Signed blob, ready for submit-signed-blob'),
    hash: z.string().describe('Transaction hash'),
  }),
  execute: async ({ network, ...params }, { mastra }) => {
    // Before any connection: a seed must never reach a node that is not a test network
    assertSeedAllowed(network)
    const client = await getXrplClient(network, mastra)
    const { tx, tx_blob, hash } = await signLoanSet(client, params)
    return { txn: tx as unknown as Record<string, unknown>, tx_blob, hash }
  },
})
