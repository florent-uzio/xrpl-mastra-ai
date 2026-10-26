import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertSeedAllowed, isTestNetwork } from './test-networks'

afterEach(() => vi.unstubAllEnvs())

describe('isTestNetwork', () => {
  it.each([
    'wss://s.altnet.rippletest.net:51233/',
    'wss://clio.altnet.rippletest.net:51233/',
    'wss://testnet.honeycluster.io/',
    'wss://testnet.xrpl-labs.com/',
    'wss://s.devnet.rippletest.net:51233/',
    'wss://clio.devnet.rippletest.net:51233/',
    'wss://devnet.honeycluster.io/',
    'wss://xahau-test.net/',
  ])('allows the known test network %s', url => {
    expect(isTestNetwork(url)).toBe(true)
  })

  it.each([
    'wss://xrplcluster.com/',
    'wss://xrpl.ws/',
    'wss://s1.ripple.com/',
    'wss://s2.ripple.com/',
    'wss://honeycluster.io/',
  ])('refuses the mainnet URL %s', url => {
    expect(isTestNetwork(url)).toBe(false)
  })

  it.each(['wss://example.com/', 'ws://localhost:6006', 'not a url', '', 'https://s.altnet.rippletest.net:51233/'])(
    'refuses the unknown URL %j',
    url => {
      expect(isTestNetwork(url)).toBe(false)
    },
  )

  it.each(['wss://s.altnet.rippletest.net:51233', 'WSS://S.ALTNET.RIPPLETEST.NET:51233/', '  wss://xahau-test.net  '])(
    'normalises %j',
    url => {
      expect(isTestNetwork(url)).toBe(true)
    },
  )

  it('does not match a different port or path', () => {
    expect(isTestNetwork('wss://s.altnet.rippletest.net:443/')).toBe(false)
    expect(isTestNetwork('wss://xahau-test.net/other')).toBe(false)
  })

  it('allows one URL from XRPL_EXTRA_TEST_NETWORKS', () => {
    expect(isTestNetwork('ws://localhost:6006/')).toBe(false)
    vi.stubEnv('XRPL_EXTRA_TEST_NETWORKS', 'ws://localhost:6006')
    expect(isTestNetwork('ws://localhost:6006/')).toBe(true)
  })

  it('allows several URLs from XRPL_EXTRA_TEST_NETWORKS, ignoring spaces and empty entries', () => {
    vi.stubEnv('XRPL_EXTRA_TEST_NETWORKS', 'wss://one.example.com/, wss://two.example.com:7007 ,,')
    expect(isTestNetwork('wss://one.example.com')).toBe(true)
    expect(isTestNetwork('wss://two.example.com:7007/')).toBe(true)
    expect(isTestNetwork('wss://three.example.com/')).toBe(false)
    expect(isTestNetwork('')).toBe(false)
  })
})

describe('assertSeedAllowed', () => {
  it('passes on a test network', () => {
    expect(() => assertSeedAllowed('wss://xahau-test.net/')).not.toThrow()
  })

  it('names the network and the two ways forward', () => {
    expect(() => assertSeedAllowed('wss://xrplcluster.com/')).toThrow(
      /wss:\/\/xrplcluster\.com\/.*signature.*XRPL_EXTRA_TEST_NETWORKS/s,
    )
  })
})
