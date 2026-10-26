// Wallet seeds may only be used on test networks. This is the single place that decides which networks those are.
const KNOWN_TEST_NETWORKS = [
  // Testnet
  'wss://s.altnet.rippletest.net:51233/',
  'wss://clio.altnet.rippletest.net:51233/',
  'wss://testnet.honeycluster.io/',
  'wss://testnet.xrpl-labs.com/',
  // Devnet
  'wss://s.devnet.rippletest.net:51233/',
  'wss://clio.devnet.rippletest.net:51233/',
  'wss://devnet.honeycluster.io/',
  // Xahau Testnet
  'wss://xahau-test.net/',
]

/** Lowercases scheme and host and drops the trailing slash. Returns undefined for anything that is not a URL. */
const normalizeNetworkUrl = (url: string): string | undefined => {
  try {
    const { protocol, host, pathname, search } = new URL(url.trim())
    return `${protocol}//${host}${pathname.replace(/\/+$/, '')}${search}`
  } catch {
    return undefined
  }
}

// Read from the process environment on every call and never from tool input, so a prompt cannot unlock a network.
const extraTestNetworks = () => (process.env.XRPL_EXTRA_TEST_NETWORKS ?? '').split(',')

/** Whether a wallet seed may be used on this network URL. Fails closed for anything unknown. */
export const isTestNetwork = (network: string): boolean => {
  const normalized = normalizeNetworkUrl(network)
  if (normalized === undefined) return false

  return [...KNOWN_TEST_NETWORKS, ...extraTestNetworks()].some(url => normalizeNetworkUrl(url) === normalized)
}

/** Throws unless a wallet seed may be used on this network. Call before connecting to the network. */
export const assertSeedAllowed = (network: string): void => {
  if (!isTestNetwork(network)) {
    throw new Error(
      `Wallet seeds are refused on ${network} because it is not a known test network. ` +
        `On mainnet, sign the transaction yourself and submit the signature. ` +
        `For a custom test network, add its URL to the XRPL_EXTRA_TEST_NETWORKS environment variable (comma-separated).`,
    )
  }
}
