import { describe, expect, it } from 'vitest'
import { workingMemorySchema } from './working-memory'

describe('workingMemorySchema', () => {
  it('accepts an empty memory', () => {
    expect(workingMemorySchema.safeParse({}).success).toBe(true)
  })

  it('accepts wallets, MPT issuances and ElGamal keys', () => {
    const result = workingMemorySchema.safeParse({
      wallets: [{ label: 'issuer', network: 'wss://s.altnet.rippletest.net:51233/', address: 'rA', seed: 'sB' }],
      mptIssuances: [{ id: '00AB', issuer: 'rA', network: 'wss://s.altnet.rippletest.net:51233/' }],
      elgamalKeys: [{ owner: 'rA', publicKey: '02AA' }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects a wallet without an address', () => {
    expect(workingMemorySchema.safeParse({ wallets: [{ label: 'x', network: 'n' }] }).success).toBe(false)
  })
})
