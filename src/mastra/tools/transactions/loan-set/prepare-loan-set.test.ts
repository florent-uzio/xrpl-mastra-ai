import { Client, ECDSA, LoanSet, signLoanSetByCounterparty, Wallet } from 'xrpl'
import { describe, expect, it } from 'vitest'
import { prepareLoanSet } from './prepare-loan-set'

const broker = Wallet.generate(ECDSA.secp256k1)
const borrower = Wallet.generate(ECDSA.secp256k1)

const txn = {
  TransactionType: 'LoanSet' as const,
  Account: broker.classicAddress,
  Counterparty: borrower.classicAddress,
  LoanBrokerID: 'A'.repeat(64),
  PrincipalRequested: '100',
}

// Mirrors client.autofill: only fills the fields that are missing
const client = {
  getLedgerIndex: async () => 1000,
  autofill: async (tx: LoanSet) => ({
    ...tx,
    Fee: tx.Fee ?? '24',
    Sequence: tx.Sequence ?? 7,
    LastLedgerSequence: tx.LastLedgerSequence ?? 1020,
  }),
} as unknown as Client

describe('prepareLoanSet', () => {
  it('autofills an unsigned LoanSet that expires 200 ledgers ahead by default', async () => {
    const prepared = await prepareLoanSet(client, { txn })
    expect(prepared).toMatchObject({ ...txn, Fee: '24', Sequence: 7, LastLedgerSequence: 1200 })
    expect(prepared.TxnSignature).toBeUndefined()
  })

  it('uses expiryLedgers, but keeps an explicit LastLedgerSequence', async () => {
    expect(await prepareLoanSet(client, { txn, expiryLedgers: 50 })).toMatchObject({ LastLedgerSequence: 1050 })
    expect(
      await prepareLoanSet(client, { txn: { ...txn, LastLedgerSequence: 1500 }, expiryLedgers: 50 }),
    ).toMatchObject({ LastLedgerSequence: 1500 })
  })

  it('sets Sequence to 0 when a Ticket is used', async () => {
    expect(await prepareLoanSet(client, { txn: { ...txn, TicketSequence: 12 } })).toMatchObject({
      Sequence: 0,
      TicketSequence: 12,
    })
  })

  it('can be signed by Account, then by the counterparty', async () => {
    const prepared = await prepareLoanSet(client, { txn })
    const { tx } = signLoanSetByCounterparty(borrower, broker.sign(prepared).tx_blob)
    expect(tx).toMatchObject({ SigningPubKey: broker.publicKey, LastLedgerSequence: 1200 })
    expect(tx.CounterpartySignature?.SigningPubKey).toBe(borrower.publicKey)
  })

  it('rejects a missing Counterparty or a CounterpartySignature already set', async () => {
    const { Counterparty: _, ...noCounterparty } = txn
    await expect(prepareLoanSet(client, { txn: noCounterparty })).rejects.toThrow('Counterparty is required')
    await expect(
      prepareLoanSet(client, { txn: { ...txn, CounterpartySignature: { TxnSignature: 'AB' } } }),
    ).rejects.toThrow('must not be set')
  })
})
