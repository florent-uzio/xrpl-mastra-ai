import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getXrplClient } from '../../../helpers'
import * as tools from '../index'

vi.mock('../../../helpers', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../helpers')>()),
  getXrplClient: vi.fn(),
}))

const TESTNET = 'wss://s.altnet.rippletest.net:51233/'
const ACCOUNT = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const ISSUER = 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe'
const RLUSD = '524C555344000000000000000000000000000000'

type ExecutableTool = { execute: (input: unknown, context: unknown) => Promise<unknown> }

/** A fake client that records every request and answers with an empty result. */
const requests: Record<string, unknown>[] = []
const fakeClient = {
  url: TESTNET,
  request: async (request: Record<string, unknown>) => {
    requests.push(request)
    return { type: 'response', result: {} }
  },
}

/** Runs the tool through its real execute and returns the request that reached the client. */
const requestSentBy = async (toolName: keyof typeof tools, request: object) => {
  requests.length = 0
  await (tools[toolName] as unknown as ExecutableTool).execute({ network: TESTNET, request }, {})
  return requests[0]
}

beforeEach(() => {
  vi.mocked(getXrplClient)
    .mockClear()
    .mockResolvedValue(fakeClient as never)
})

describe('method tools', () => {
  it('sends the request with its command to the given network', async () => {
    expect(await requestSentBy('getAccountInfoTool', { account: ACCOUNT })).toEqual({
      account: ACCOUNT,
      command: 'account_info',
    })
    expect(vi.mocked(getXrplClient).mock.calls[0][0]).toBe(TESTNET)
  })

  it('sends a command xrpl.js does not type yet', async () => {
    expect(await requestSentBy('getVersionTool', {})).toEqual({ command: 'version' })
  })

  it('returns the server response', async () => {
    const result = await (tools.getFeeTool as unknown as ExecutableTool).execute({ network: TESTNET, request: {} }, {})
    expect(result).toEqual({ type: 'response', result: {} })
  })

  it('hex-encodes the currency codes of book_offers, amm_info and ripple_path_find', async () => {
    const rlusd = { currency: 'RLUSD', issuer: ISSUER }
    const encoded = { currency: RLUSD, issuer: ISSUER }

    expect(await requestSentBy('getBookOffersTool', { taker_gets: { currency: 'XRP' }, taker_pays: rlusd })).toEqual({
      taker_gets: { currency: 'XRP' },
      taker_pays: encoded,
      command: 'book_offers',
    })
    expect(await requestSentBy('getAmmInfoTool', { asset: { currency: 'XRP' }, asset2: rlusd })).toMatchObject({
      asset2: encoded,
    })
    expect(
      await requestSentBy('getRipplePathFindTool', {
        source_account: ACCOUNT,
        destination_account: ISSUER,
        destination_amount: { ...rlusd, value: '1' },
        source_currencies: [rlusd],
      }),
    ).toMatchObject({ destination_amount: { ...encoded, value: '1' }, source_currencies: [encoded] })
  })

  it('hex-encodes the currency of a ripple_state ledger entry', async () => {
    const request = await requestSentBy('getLedgerEntryTool', {
      ripple_state: { accounts: [ACCOUNT, ISSUER], currency: 'RLUSD' },
    })
    expect(request).toMatchObject({ ripple_state: { currency: RLUSD }, command: 'ledger_entry' })
  })

  // xrpl.js does not type every command, so the type checker cannot catch a typo in one
  it('gives every tool a unique, snake_case command', () => {
    const files = readdirRecursive(path.join(__dirname, 'public'))
    const commands = files.flatMap(file =>
      [...readFileSync(file, 'utf8').matchAll(/command: '([^']+)'/g)].map(m => m[1]),
    )

    expect(commands).toHaveLength(38)
    commands.forEach(command => expect(command).toMatch(/^[a-z]+(_[a-z]+)*$/))
    expect(new Set(commands).size).toBe(commands.length)
  })
})

const readdirRecursive = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? readdirRecursive(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  )
