import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getFlowRecordsTool, saveFlowRecordTool } from './flow-records'

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
    const saved = await saveFlowRecordTool.execute!({ flow: 'manual-nft-test', network: 'testnet', data }, {} as never)

    const found = await getFlowRecordsTool.execute!({ id: (saved as { id: string }).id }, {} as never)
    expect((found as { records: { data: unknown }[] }).records).toHaveLength(1)
    expect((found as { records: { data: unknown }[] }).records[0].data).toEqual(data)
  })

  it('rejects flow names that could escape the records directory', async () => {
    const result = await saveFlowRecordTool.inputSchema!['~standard'].validate({
      flow: '../evil',
      network: 'testnet',
      data: {},
    })
    expect(result.issues).toBeDefined()
  })
})
