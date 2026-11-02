import { Payment, Wallet } from 'xrpl'
import { describe, expect, it, vi } from 'vitest'
import { autofill, LedgerClient, submit } from './ledger'

const TESTNET = 'wss://s.altnet.rippletest.net:51233/'
const MAINNET = 'wss://xrplcluster.com/'

const wallet = Wallet.generate()
const payment: Payment = {
  TransactionType: 'Payment',
  Account: wallet.classicAddress,
  Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  Amount: '1000000',
}

/** A fake client: every submission is validated with `engineResult`. */
const fakeClient = (url: string, engineResult = 'tesSUCCESS') => {
  const client = {
    url,
    submitAndWait: vi.fn(async () => ({
      result: { hash: 'ABC', validated: true, meta: { TransactionResult: engineResult } },
    })),
    autofill: vi.fn(async (tx: unknown) => tx),
  }
  return client as typeof client & LedgerClient
}

describe('submit', () => {
  it('returns ok for tesSUCCESS', async () => {
    const result = await submit(fakeClient(TESTNET), payment, { wallet })

    expect(result).toMatchObject({ ok: true, engineResult: 'tesSUCCESS', hash: 'ABC', validated: true })
  })

  it('returns ok: false for a tec result instead of throwing', async () => {
    const result = await submit(fakeClient(TESTNET, 'tecNO_LINE'), payment, { wallet })

    expect(result).toMatchObject({ ok: false, engineResult: 'tecNO_LINE' })
  })

  it('refuses a wallet on mainnet before submitting anything', async () => {
    const client = fakeClient(MAINNET)

    await expect(submit(client, payment, { wallet })).rejects.toThrow(/not a known test network/)
    expect(client.submitAndWait).not.toHaveBeenCalled()
  })

  it('submits a signed blob as is, on any network', async () => {
    const client = fakeClient(MAINNET)

    const result = await submit(client, payment, { signedBlob: 'DEADBEEF' })

    expect(result.ok).toBe(true)
    expect(client.submitAndWait).toHaveBeenCalledWith('DEADBEEF')
  })

  it('sets Sequence to 0 when a Ticket is used', async () => {
    const client = fakeClient(TESTNET)

    await submit(client, { ...payment, TicketSequence: 7 }, { wallet })

    expect(client.submitAndWait).toHaveBeenCalledWith(expect.objectContaining({ TicketSequence: 7, Sequence: 0 }), {
      autofill: true,
      wallet,
    })
  })
})

describe('autofill', () => {
  it('sets Sequence to 0 when a Ticket is used and passes the signer count through', async () => {
    const client = fakeClient(TESTNET)

    await autofill(client, { ...payment, TicketSequence: 7 }, 2)

    expect(client.autofill).toHaveBeenCalledWith(expect.objectContaining({ Sequence: 0 }), 2)
  })

  it('leaves Sequence alone without a Ticket', async () => {
    const client = fakeClient(TESTNET)

    await autofill(client, payment)

    expect(client.autofill).toHaveBeenCalledWith(payment, undefined)
  })
})
