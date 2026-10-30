import { describe, expect, it } from 'vitest'
import { lendingSetupWorkflowSchema } from './lending-setup-workflow.types'

const base = { network: 'wss://s.devnet.rippletest.net:51233/' } as const

describe('lendingSetupWorkflowSchema', () => {
  it('fills in the defaults: new MPT, large amounts, 5 min subscription, 1 h investment', () => {
    const result = lendingSetupWorkflowSchema.parse(base)
    expect(result).toMatchObject({
      issuance: { source: 'create', assetScale: 2 },
      mintAmount: '100000000',
      depositAmount: '50000000',
      coverAmount: '5000000',
      managementFeeRate: 5000,
      coverRateMinimum: 10000,
      coverRateLiquidation: 50000,
      subscriptionSeconds: 300,
      investmentSeconds: 3600,
    })
  })

  it('accepts an existing MPT with its issuer seed', () => {
    const issuance = {
      source: 'existing',
      mptIssuanceId: '0063467485386D7775720D2D03839D40A677B5BABC7E7DBC',
      issuerSeed: 's',
    }
    expect(lendingSetupWorkflowSchema.safeParse({ ...base, issuance }).success).toBe(true)
  })

  it('rejects an existing MPT without the issuer seed', () => {
    const issuance = { source: 'existing', mptIssuanceId: '0063467485386D7775720D2D03839D40A677B5BABC7E7DBC' }
    expect(lendingSetupWorkflowSchema.safeParse({ ...base, issuance }).success).toBe(false)
  })

  it('rejects testnet, where LendingProtocolV1_1 is not enabled', () => {
    const result = lendingSetupWorkflowSchema.safeParse({ network: 'wss://s.altnet.rippletest.net:51233/' })
    expect(result.success).toBe(false)
  })

  it('rejects a deposit larger than the minted amount', () => {
    const result = lendingSetupWorkflowSchema.safeParse({ ...base, mintAmount: '100', depositAmount: '101' })
    expect(result.success).toBe(false)
  })

  it('rejects a cover larger than the minted amount', () => {
    const result = lendingSetupWorkflowSchema.safeParse({
      ...base,
      mintAmount: '100',
      depositAmount: '1',
      coverAmount: '101',
    })
    expect(result.success).toBe(false)
  })

  it('rejects only one of the two cover rates being zero', () => {
    const result = lendingSetupWorkflowSchema.safeParse({ ...base, coverRateMinimum: 0 })
    expect(result.success).toBe(false)
  })

  it('accepts both cover rates at zero', () => {
    const result = lendingSetupWorkflowSchema.safeParse({ ...base, coverRateMinimum: 0, coverRateLiquidation: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects an investment period shorter than 180 s', () => {
    expect(lendingSetupWorkflowSchema.safeParse({ ...base, investmentSeconds: 179 }).success).toBe(false)
  })
})
