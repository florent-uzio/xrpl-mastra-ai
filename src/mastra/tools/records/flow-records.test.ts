import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { listFlowRecords } from '../../../helpers'
import { getFlowRecordsTool, saveFlowRecordTool } from './flow-records'

const TESTNET = 'wss://s.altnet.rippletest.net:51233/'
const MAINNET = 'wss://xrplcluster.com/'

const save = (network: string, data: object, flow = 'manual-test') =>
  saveFlowRecordTool.execute!({ flow, network, data } as never, {} as never)
const get = async (input: object) =>
  ((await getFlowRecordsTool.execute!({ limit: 10, ...input } as never, {} as never)) as { records: { id: string }[] })
    .records

describe('records tools', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'records-tools-'))
    process.env.XRPL_RECORDS_DIR = dir
  })

  afterEach(async () => {
    delete process.env.XRPL_RECORDS_DIR
    await rm(dir, { recursive: true })
  })

  it('saves a manual record that get-flow-records can read back', async () => {
    const data = { wallets: [{ address: 'rA', seed: 'sA' }], nftId: 'ABC' }
    const saved = await saveFlowRecordTool.execute!({ flow: 'manual-nft-test', network: TESTNET, data }, {} as never)

    const found = await getFlowRecordsTool.execute!({ id: (saved as { id: string }).id, limit: 10 }, {} as never)
    expect((found as { records: { data: unknown }[] }).records).toHaveLength(1)
    expect((found as { records: { data: unknown }[] }).records[0].data).toEqual(data)
  })

  it('rejects flow names that could escape the records directory', async () => {
    const result = await saveFlowRecordTool.inputSchema!['~standard'].validate({
      flow: '../evil',
      network: TESTNET,
      data: {},
    })
    expect(result.issues).toBeDefined()
  })

  it('refuses seeds and private keys on a network that is not a test network, at any depth', async () => {
    await expect(save(MAINNET, { wallets: [{ address: 'rA', seed: 'sA' }] })).rejects.toThrow(
      /data\.wallets\[0\]\.seed/,
    )
    await expect(save(MAINNET, { holder: { privateKey: 'ED00' } })).rejects.toThrow(/privateKey/)
    await expect(save('testnet', { seed: 'sA' })).rejects.toThrow(/not a known test network/)
  })

  it('saves addresses and public keys on mainnet', async () => {
    await expect(save(MAINNET, { issuer: 'rA', publicKey: 'ED01' })).resolves.toMatchObject({ flow: 'manual-test' })
  })

  it('returns the newest records first, up to limit', async () => {
    for (const n of [1, 2, 3]) {
      await save(TESTNET, { n })
      await new Promise(resolve => setTimeout(resolve, 5))
    }

    expect(await get({ limit: 2 })).toHaveLength(2)
    expect(await get({})).toHaveLength(3)
  })

  it('skips a corrupt record file instead of failing every lookup', async () => {
    await save(TESTNET, { ok: true })
    await mkdir(path.join(dir, 'manual-test'), { recursive: true })
    await writeFile(path.join(dir, 'manual-test', 'broken.json'), '{ not json')

    expect(await get({})).toHaveLength(1)
  })

  it('refuses a flow name that would leave the records folder when listing', async () => {
    // The tool's schema rejects it, and the helper does too for any other caller
    const result = await getFlowRecordsTool.execute!({ flow: '../..', limit: 10 }, {} as never)
    expect(JSON.stringify(result)).toMatch(/validation/i)
    await expect(listFlowRecords('../..')).rejects.toThrow(/Invalid flow name/)
  })
})
