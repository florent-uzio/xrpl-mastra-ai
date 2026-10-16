import { describe, expect, it } from 'vitest'
import { mptIssuanceWorkflowSchema } from './mpt-issuance-workflow.types'

const base = { network: 'wss://s.altnet.rippletest.net:51233/', holders: 2, mintAmount: '100' } as const

describe('mptIssuanceWorkflowSchema', () => {
  it('accepts an issuance with transfer fee and tfMPTCanTransfer', () => {
    const result = mptIssuanceWorkflowSchema.safeParse({
      ...base,
      issuance: { flags: ['tfMPTCanTransfer', 'tfMPTRequireAuth'], transferFee: 500, maximumAmount: '1000' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects a transfer fee without tfMPTCanTransfer', () => {
    const result = mptIssuanceWorkflowSchema.safeParse({ ...base, issuance: { transferFee: 500 } })
    expect(result.success).toBe(false)
  })

  it('rejects a mint that exceeds the maximum amount', () => {
    const result = mptIssuanceWorkflowSchema.safeParse({ ...base, issuance: { maximumAmount: '199' } })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown flag', () => {
    const result = mptIssuanceWorkflowSchema.safeParse({ ...base, issuance: { flags: ['tfMPTNope'] } })
    expect(result.success).toBe(false)
  })

  it('accepts XLS-89 metadata', () => {
    const metadata = {
      ticker: 'TEST',
      name: 'Test',
      icon: 'https://example.com/i.png',
      asset_class: 'other',
      issuer_name: 'Acme',
    }
    expect(mptIssuanceWorkflowSchema.safeParse({ ...base, issuance: { metadata } }).success).toBe(true)
  })

  it('rejects metadata that fails the xrpl.js XLS-89 validation', () => {
    const metadata = {
      ticker: 'too long!',
      name: 'Test',
      icon: 'https://example.com/i.png',
      asset_class: 'bogus',
      issuer_name: 'Acme',
    }
    const result = mptIssuanceWorkflowSchema.safeParse({ ...base, issuance: { metadata } })
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('ticker')
  })
})
