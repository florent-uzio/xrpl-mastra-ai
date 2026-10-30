import { createTool } from '@mastra/core/tools'
import { Client, LoanSet } from 'xrpl'
import { z } from 'zod'
import { getXrplClient, networkSchema } from '../../../../helpers'
import { xrplLoanSetSchema } from './loan-set.types'

const DEFAULT_EXPIRY_LEDGERS = 200

type PrepareParams = {
  txn: z.infer<typeof xrplLoanSetSchema>
  expiryLedgers?: number
}

/**
 * Autofills an unsigned LoanSet for two parties who sign on their own machines. The expiry is longer than
 * autofill's ~20 ledgers so the blob survives the handoff. The Fee already covers the counterparty's signers.
 */
export const prepareLoanSet = async (client: Client, { txn, expiryLedgers }: PrepareParams) => {
  if (!txn.Counterparty) {
    throw new Error('Counterparty is required: the other party of the loan')
  }
  if (txn.CounterpartySignature) {
    throw new Error('CounterpartySignature must not be set: the counterparty adds it after Account signs')
  }

  const tx = { ...txn } as LoanSet
  // autofill sets Sequence even when a Ticket is used, so it must be 0 beforehand
  if (tx.TicketSequence !== undefined) tx.Sequence = 0
  if (tx.LastLedgerSequence === undefined) {
    tx.LastLedgerSequence = (await client.getLedgerIndex()) + (expiryLedgers ?? DEFAULT_EXPIRY_LEDGERS)
  }

  return client.autofill(tx)
}

export const prepareLoanSetTool = createTool({
  id: 'prepare-loan-set',
  description: `Autofill a LoanSet and return it unsigned, for the two parties to sign on their own machines. Read-only: no seed, nothing is signed or submitted. Works on every network, mainnet included.

On testnet/devnet with both seeds, use sign-loan-set instead.

Input:
- network: websocket URL
- txn: the LoanSet terms (same fields as submit-loan-set), with Account and Counterparty set. Do not set CounterpartySignature. Set TicketSequence to use a Ticket.
- expiryLedgers: ledgers until the transaction expires (default 200, about 10 minutes). Ignored when txn.LastLedgerSequence is set.

Output: the unsigned LoanSet with Fee, Sequence and LastLedgerSequence set. Keep every field unchanged, then:
1. Account signs it (xrpl.js: wallet.sign(txn)) and sends the tx_blob to the counterparty
2. The counterparty adds CounterpartySignature with the LoanSet counterparty prefix (xrpl.js: signLoanSetByCounterparty(wallet, tx_blob)). A normal signature is rejected (temBAD_SIGNER)
3. Either party submits the final tx_blob with submit-signed-blob before LastLedgerSequence

If Account sends any other transaction in between, the Sequence is used up and the LoanSet fails (tefPAST_SEQ). Use a Ticket (TicketSequence) to avoid this.

The Fee covers the counterparty's signer list. If Account itself multi-signs, the Fee is too low.`,
  inputSchema: z.object({
    network: networkSchema,
    txn: xrplLoanSetSchema.describe('LoanSet terms, with Account and Counterparty set'),
    expiryLedgers: z
      .number()
      .int()
      .min(1)
      .max(10000)
      .optional()
      .describe('Ledgers until the transaction expires. Default 200 (about 10 minutes)'),
  }),
  outputSchema: z.object({
    txn: z.looseObject({}).describe('Unsigned LoanSet with Fee, Sequence and LastLedgerSequence set'),
  }),
  execute: async ({ network, ...params }, { mastra }) => {
    const client = await getXrplClient(network, mastra)
    const txn = await prepareLoanSet(client, params)
    return { txn: txn as unknown as Record<string, unknown> }
  },
})
