import { describe, expect, it } from 'vitest'
import { confidentialMptWorkflowSchema } from './confidential-mpt-workflow.types'

const base = {
  network: 'wss://s.devnet.rippletest.net:51233/',
  issuer: { source: 'generate' },
  issuance: { source: 'create' },
  holder: { source: 'generate' },
  convertAmount: '100',
} as const

const seed = { source: 'seed', seed: 'sEd7tRAv3xbMLd1gn1sj6TpjS5NwDhH' } as const

describe('confidentialMptWorkflowSchema', () => {
  it('accepts everything generated', () => {
    expect(confidentialMptWorkflowSchema.safeParse(base).success).toBe(true)
  })

  it('accepts an existing issuer issuing a new MPT', () => {
    expect(confidentialMptWorkflowSchema.safeParse({ ...base, issuer: seed }).success).toBe(true)
  })

  it('accepts an existing issuance with its issuer seed', () => {
    const result = confidentialMptWorkflowSchema.safeParse({
      ...base,
      issuer: seed,
      issuance: { source: 'existing', mptIssuanceId: 'ABCD' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects an existing issuance with a generated issuer', () => {
    const result = confidentialMptWorkflowSchema.safeParse({
      ...base,
      issuance: { source: 'existing', mptIssuanceId: 'ABCD' },
    })
    expect(result.success).toBe(false)
  })

  it('requires an explicit source for accounts', () => {
    expect(confidentialMptWorkflowSchema.safeParse({ ...base, holder: {} }).success).toBe(false)
    expect(confidentialMptWorkflowSchema.safeParse({ ...base, holder: { seed: seed.seed } }).success).toBe(false)
  })

  it('accepts a send and a convert back that fit in convertAmount', () => {
    const result = confidentialMptWorkflowSchema.safeParse({
      ...base,
      send: { amount: '60', destination: { source: 'generate' } },
      convertBack: { amount: '40' },
    })
    expect(result.success).toBe(true)
  })

  it('requires a destination source for a send', () => {
    expect(confidentialMptWorkflowSchema.safeParse({ ...base, send: { amount: '1' } }).success).toBe(false)
  })

  it('rejects a new holder spending more than it converts', () => {
    const result = confidentialMptWorkflowSchema.safeParse({
      ...base,
      send: { amount: '60', destination: { source: 'generate' } },
      convertBack: { amount: '41' },
    })
    expect(result.success).toBe(false)
  })

  it('does not check the spent amount for an existing holder, which may already have a confidential balance', () => {
    const result = confidentialMptWorkflowSchema.safeParse({
      ...base,
      holder: seed,
      send: { amount: '500', destination: { source: 'generate' } },
    })
    expect(result.success).toBe(true)
  })

  it('rejects networks without the amendment', () => {
    const result = confidentialMptWorkflowSchema.safeParse({ ...base, network: 'wss://s.altnet.rippletest.net:51233/' })
    expect(result.success).toBe(false)
  })

  it.each(['0', '-5', '1.5', 'abc'])('rejects convertAmount %s', convertAmount => {
    expect(confidentialMptWorkflowSchema.safeParse({ ...base, convertAmount }).success).toBe(false)
  })
})
