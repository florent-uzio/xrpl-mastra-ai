import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { listFlowRecords, saveFlowRecord } from './flow-records'

describe('flow records', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'flow-records-'))
    process.env.XRPL_RECORDS_DIR = dir
  })

  afterEach(async () => {
    delete process.env.XRPL_RECORDS_DIR
    await rm(dir, { recursive: true })
  })

  it('returns nothing when no record was saved', async () => {
    expect(await listFlowRecords()).toEqual([])
  })

  it('saves a record and lists it back, newest first, filtered by flow', async () => {
    const first = await saveFlowRecord({ flow: 'mpt-issuance', network: 'testnet', data: { mptIssuanceId: 'AA' } })
    await new Promise(resolve => setTimeout(resolve, 5))
    const second = await saveFlowRecord({ flow: 'mpt-issuance', network: 'testnet', data: { mptIssuanceId: 'BB' } })
    await saveFlowRecord({ flow: 'iou-issuance', network: 'devnet', data: {} })

    expect(first.path.startsWith(dir)).toBe(true)
    expect((await listFlowRecords('mpt-issuance')).map(r => r.id)).toEqual([second.record.id, first.record.id])
    expect(await listFlowRecords()).toHaveLength(3)
  })
})
