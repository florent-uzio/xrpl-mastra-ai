import { SubmittableTransaction } from 'xrpl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getXrplClient } from '../../../helpers'
import * as tools from '../index'

vi.mock('../../../helpers', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../helpers')>()),
  getXrplClient: vi.fn(),
}))

const TESTNET = 'wss://s.altnet.rippletest.net:51233/'
const SEED = 'sEdTM1uX8pu2do5XvTnutH6HsouMaM2'
const ACCOUNT = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const ISSUER = 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe'
const RLUSD = '524C555344000000000000000000000000000000'

type ExecutableTool = { execute: (input: unknown, context: unknown) => Promise<unknown> }

/** A fake testnet client that records the transaction it is asked to submit. */
const submitted: SubmittableTransaction[] = []
const fakeClient = {
  url: TESTNET,
  autofill: async (tx: unknown) => tx,
  submitAndWait: async (tx: SubmittableTransaction) => {
    submitted.push(tx)
    return { result: { hash: 'HASH', validated: true, meta: { TransactionResult: 'tesSUCCESS' } } }
  },
}

/** Runs the tool through its real execute and returns the transaction that reached the client. */
const submittedBy = async (toolName: keyof typeof tools, txn: object) => {
  submitted.length = 0
  await (tools[toolName] as unknown as ExecutableTool).execute({ network: TESTNET, seed: SEED, txn }, {})
  return submitted[0] as unknown as Record<string, unknown>
}

beforeEach(() => {
  vi.mocked(getXrplClient).mockResolvedValue(fakeClient as never)
})

describe('currency codes are hex-encoded by the factory', () => {
  it('encodes every amount of a cross-currency Payment, Paths included', async () => {
    const tx = await submittedBy('submitPaymentTool', {
      TransactionType: 'Payment',
      Account: ACCOUNT,
      Destination: ISSUER,
      Amount: { currency: 'RLUSD', issuer: ISSUER, value: '10' },
      SendMax: { currency: 'EURO1', issuer: ISSUER, value: '12' },
      DeliverMin: { currency: 'RLUSD', issuer: ISSUER, value: '9' },
      Paths: [[{ currency: 'RLUSD', issuer: ISSUER }]],
      Flags: 131072,
    })

    expect(tx.Amount).toMatchObject({ currency: RLUSD })
    expect(tx.SendMax).toMatchObject({ currency: '4555524F31000000000000000000000000000000' })
    expect(tx.DeliverMin).toMatchObject({ currency: RLUSD })
    expect(tx.Paths).toEqual([[{ currency: RLUSD, issuer: ISSUER }]])
  })

  it('leaves XRP drops, 3-character codes and MPT amounts unchanged', async () => {
    const tx = await submittedBy('submitOfferCreateTool', {
      TransactionType: 'OfferCreate',
      Account: ACCOUNT,
      TakerGets: '1000000',
      TakerPays: { currency: 'USD', issuer: ISSUER, value: '1' },
    })

    expect(tx.TakerGets).toBe('1000000')
    expect(tx.TakerPays).toMatchObject({ currency: 'USD' })
  })

  it('encodes TrustSet LimitAmount', async () => {
    const tx = await submittedBy('submitTrustSetTool', {
      TransactionType: 'TrustSet',
      Account: ACCOUNT,
      LimitAmount: { currency: 'RLUSD', issuer: ISSUER, value: '100' },
    })

    expect(tx.LimitAmount).toMatchObject({ currency: RLUSD })
  })

  it('encodes both AMMCreate amounts', async () => {
    const tx = await submittedBy('submitAmmCreateTool', {
      TransactionType: 'AMMCreate',
      Account: ACCOUNT,
      Amount: '1000000',
      Amount2: { currency: 'RLUSD', issuer: ISSUER, value: '10' },
      TradingFee: 500,
    })

    expect(tx.Amount).toBe('1000000')
    expect(tx.Amount2).toMatchObject({ currency: RLUSD })
  })

  it('encodes the Clawback amount, which no tool encoded before', async () => {
    const tx = await submittedBy('submitClawbackTool', {
      TransactionType: 'Clawback',
      Account: ISSUER,
      Amount: { currency: 'RLUSD', issuer: ACCOUNT, value: '5' },
    })

    expect(tx.Amount).toMatchObject({ currency: RLUSD })
  })

  it('encodes Oracle BaseAsset and QuoteAsset', async () => {
    const tx = await submittedBy('submitOracleSetTool', {
      TransactionType: 'OracleSet',
      Account: ACCOUNT,
      OracleDocumentID: 1,
      LastUpdateTime: 1_800_000_000,
      Provider: '70726F7669646572',
      AssetClass: '63757272656E6379',
      PriceDataSeries: [{ PriceData: { BaseAsset: 'XRP', QuoteAsset: 'RLUSD', AssetPrice: 740, Scale: 3 } }],
    })

    expect(tx.PriceDataSeries).toEqual([
      { PriceData: { BaseAsset: 'XRP', QuoteAsset: RLUSD, AssetPrice: '2e4', Scale: 3 } },
    ])
  })
})

describe('AccountSet Domain', () => {
  it('sends an empty Domain to clear it', async () => {
    const tx = await submittedBy('submitAccountSetTool', {
      TransactionType: 'AccountSet',
      Account: ACCOUNT,
      Domain: '',
    })

    expect(tx.Domain).toBe('')
  })

  it('hex-encodes a Domain and leaves an absent one out', async () => {
    expect(
      (
        await submittedBy('submitAccountSetTool', {
          TransactionType: 'AccountSet',
          Account: ACCOUNT,
          Domain: 'example.com',
        })
      ).Domain,
    ).toBe('6578616D706C652E636F6D')
    expect(
      (await submittedBy('submitAccountSetTool', { TransactionType: 'AccountSet', Account: ACCOUNT, SetFlag: 8 }))
        .Domain,
    ).toBeUndefined()
  })
})
