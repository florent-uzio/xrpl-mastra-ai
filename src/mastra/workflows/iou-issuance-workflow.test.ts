import { SubmittableTransaction, Wallet } from 'xrpl'
import { describe, expect, it, vi } from 'vitest'
import { getXrplClient } from '../../helpers'
import { iouIssuanceWorkflow } from './iou-issuance-workflow'

vi.mock('../../helpers', async importOriginal => ({
  ...(await importOriginal<typeof import('../../helpers')>()),
  getXrplClient: vi.fn(),
}))

/** A fake testnet client: wallets are funded offline and TrustSet fails with a tec result. */
const fakeClient = () => ({
  url: 'wss://s.altnet.rippletest.net:51233/',
  fundWallet: vi.fn(async () => ({ wallet: Wallet.generate() })),
  autofill: vi.fn(async (tx: unknown) => tx),
  submitAndWait: vi.fn(async (tx: SubmittableTransaction) => ({
    result: {
      hash: `${tx.TransactionType}-HASH`,
      validated: true,
      meta: { TransactionResult: tx.TransactionType === 'TrustSet' ? 'tecNO_LINE_INSUF_RESERVE' : 'tesSUCCESS' },
    },
  })),
})

describe('iou-issuance workflow', () => {
  it('stops when a trust line fails on ledger instead of minting', async () => {
    const client = fakeClient()
    vi.mocked(getXrplClient).mockResolvedValue(client as never)

    const run = await iouIssuanceWorkflow.createRun()
    const result = await run.start({
      inputData: {
        network: 'wss://s.altnet.rippletest.net:51233/',
        trustline: { currency: 'USD', trustlineLimit: '1000' },
        issuerSettings: {},
        holders: 1,
        mintAmount: '10',
      },
    })

    expect(result.status).toBe('failed')
    expect(JSON.stringify(result)).toContain('tecNO_LINE_INSUF_RESERVE')
    const submitted = client.submitAndWait.mock.calls.map(([tx]) => tx.TransactionType)
    expect(submitted).toEqual(['TrustSet'])
  })
})
