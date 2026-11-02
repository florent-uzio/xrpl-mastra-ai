import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { SubmittableTransaction, Wallet } from 'xrpl'
import { describe, expect, it, vi } from 'vitest'
import { getXrplClient } from '../../helpers'
import { iouIssuanceWorkflow } from './iou-issuance-workflow'

vi.mock('../../helpers', async importOriginal => ({
  ...(await importOriginal<typeof import('../../helpers')>()),
  getXrplClient: vi.fn(),
}))

/** A fake testnet client: wallets are funded offline, and TrustSet fails with a tec result unless told otherwise. */
const fakeClient = (trustSetResult = 'tecNO_LINE_INSUF_RESERVE') => ({
  url: 'wss://s.altnet.rippletest.net:51233/',
  fundWallet: vi.fn(async () => ({ wallet: Wallet.generate() })),
  autofill: vi.fn(async (tx: unknown) => tx),
  submitAndWait: vi.fn(async (tx: SubmittableTransaction) => ({
    result: {
      hash: `${tx.TransactionType}-HASH`,
      validated: true,
      meta: { TransactionResult: tx.TransactionType === 'TrustSet' ? trustSetResult : 'tesSUCCESS' },
    },
  })),
})

const inputData = {
  network: 'wss://s.altnet.rippletest.net:51233/',
  trustline: { currency: 'USD', trustlineLimit: '1000' },
  issuerSettings: {},
  holders: 1,
  mintAmount: '10',
}

describe('iou-issuance workflow', () => {
  it('stops when a trust line fails on ledger instead of minting', async () => {
    const client = fakeClient()
    vi.mocked(getXrplClient).mockResolvedValue(client as never)

    const run = await iouIssuanceWorkflow.createRun()
    const result = await run.start({ inputData })

    expect(result.status).toBe('failed')
    expect(JSON.stringify(result)).toContain('tecNO_LINE_INSUF_RESERVE')
    const submitted = client.submitAndWait.mock.calls.map(([tx]) => tx.TransactionType)
    expect(submitted).toEqual(['TrustSet'])
  })

  it('returns addresses only: the seeds stay in the record', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'iou-records-'))
    process.env.XRPL_RECORDS_DIR = dir
    vi.mocked(getXrplClient).mockResolvedValue(fakeClient('tesSUCCESS') as never)

    try {
      const run = await iouIssuanceWorkflow.createRun()
      const result = await run.start({ inputData })

      expect(result.status).toBe('success')
      const output = (result as { result: { issuer: string; holders: string[]; recordId: string } }).result
      expect(output.issuer).toMatch(/^r/)
      expect(output.holders).toHaveLength(1)
      expect(JSON.stringify(output)).not.toMatch(/seed|privateKey/i)
    } finally {
      delete process.env.XRPL_RECORDS_DIR
      await rm(dir, { recursive: true })
    }
  })
})
