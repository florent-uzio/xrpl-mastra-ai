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
const ISSUER = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const HOLDER = 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe'
const MPT_ID = '00000001' + 'A'.repeat(40)

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

/** Runs the tool through its real execute: returns the submitted transaction, or what the tool returned instead. */
const run = async (toolName: keyof typeof tools, txn: object) => {
  submitted.length = 0
  const result = await (tools[toolName] as unknown as ExecutableTool).execute({ network: TESTNET, seed: SEED, txn }, {})
  return { tx: submitted[0] as unknown as Record<string, unknown> | undefined, result }
}

beforeEach(() => {
  vi.mocked(getXrplClient).mockResolvedValue(fakeClient as never)
})

describe('submit-clawback', () => {
  const clawback = (fields: object) => ({ TransactionType: 'Clawback', Account: ISSUER, ...fields })

  it('claws back an MPT from a holder', async () => {
    const { tx } = await run(
      'submitClawbackTool',
      clawback({ Amount: { mpt_issuance_id: MPT_ID, value: '10' }, Holder: HOLDER }),
    )
    expect(tx).toMatchObject({ Amount: { mpt_issuance_id: MPT_ID, value: '10' }, Holder: HOLDER })
  })

  it('requires Holder for an MPT', async () => {
    await expect(
      run('submitClawbackTool', clawback({ Amount: { mpt_issuance_id: MPT_ID, value: '10' } })),
    ).rejects.toThrow('Holder')
  })

  it('refuses Holder for a trust line token', async () => {
    await expect(
      run('submitClawbackTool', clawback({ Amount: { currency: 'USD', issuer: HOLDER, value: '1' }, Holder: HOLDER })),
    ).rejects.toThrow('Holder')
  })

  it('still claws back a trust line token', async () => {
    const { tx } = await run(
      'submitClawbackTool',
      clawback({ Amount: { currency: 'USD', issuer: HOLDER, value: '1' } }),
    )
    expect(tx).toMatchObject({ Amount: { currency: 'USD', issuer: HOLDER, value: '1' } })
  })
})

describe('submit-oracle-set', () => {
  const oracleSet = (AssetPrice: unknown) => ({
    TransactionType: 'OracleSet',
    Account: ISSUER,
    OracleDocumentID: 1,
    LastUpdateTime: 1_700_000_000,
    Provider: '70726F7669646572',
    AssetClass: '63757272656E6379',
    PriceDataSeries: [{ PriceData: { BaseAsset: 'XRP', QuoteAsset: 'USD', AssetPrice, Scale: 2 } }],
  })
  const priceOf = (tx: Record<string, unknown> | undefined) =>
    (tx?.PriceDataSeries as { PriceData: { AssetPrice: unknown } }[])[0].PriceData.AssetPrice

  it('reads a string AssetPrice as decimal, not hex', async () => {
    const { tx } = await run('submitOracleSetTool', oracleSet('740'))
    expect(priceOf(tx)).toBe((740).toString(16))
  })

  it('accepts a number and an amount above 2^53 as a string', async () => {
    expect(priceOf((await run('submitOracleSetTool', oracleSet(740))).tx)).toBe('2e4')
    expect(priceOf((await run('submitOracleSetTool', oracleSet('18446744073709551615'))).tx)).toBe('ffffffffffffffff')
  })

  it('rejects a hex string', async () => {
    const { tx } = await run('submitOracleSetTool', oracleSet('2e4'))
    expect(tx).toBeUndefined()
  })
})
