import { describe, expect, it } from 'vitest'
import * as tools from '../index'

const queryTools = Object.entries(tools).filter(
  ([name]) => /^(get.+|ping)Tool$/.test(name) && name !== 'getFlowRecordsTool',
) as unknown as [string, { id: string; inputSchema: { safeParse: (input: unknown) => { success: boolean } } }][]

const network = 'wss://s.altnet.rippletest.net:51233'
const account = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'

const getTool = (name: string) => tools[name as keyof typeof tools] as unknown as (typeof queryTools)[number][1]

describe('query tools', () => {
  it('has a unique id per tool', () => {
    const ids = queryTools.map(([, tool]) => tool.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('rejects input without a network', () => {
    queryTools.forEach(([name, tool]) => expect(tool.inputSchema.safeParse({}).success, name).toBe(false))
  })

  it.each([
    ['getTxTool', { transaction: 'A'.repeat(64) }],
    ['getLedgerTool', {}],
    ['submitSignedBlobTool', { tx_blob: '1200' + 'AB'.repeat(10) }],
    ['getBookOffersTool', { taker_gets: { currency: 'XRP' }, taker_pays: { currency: 'USD', issuer: account } }],
    ['getNftSellOffersTool', { nft_id: 'B'.repeat(64) }],
    ['getNoRippleCheckTool', { account, role: 'gateway' }],
  ])('%s accepts valid input', (name, request) => {
    expect(getTool(name).inputSchema.safeParse({ network, request }).success).toBe(true)
  })

  it.each([
    ['getTxTool', { transaction: 'short' }],
    ['submitSignedBlobTool', { tx_blob: 'not hex' }],
    ['getNoRippleCheckTool', { account, role: 'admin' }],
  ])('%s rejects invalid input', (name, request) => {
    expect(getTool(name).inputSchema.safeParse({ network, request }).success).toBe(false)
  })
})
