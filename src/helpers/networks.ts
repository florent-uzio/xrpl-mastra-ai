import { z } from 'zod'

/**
 * The single list of XRPL networks this project knows. Which networks accept wallet seeds, which ones the workflows
 * run on, and the network list in the agent instructions are all derived from it.
 *
 * @see https://xrpl.org/docs/tutorials/public-servers
 */
export type NetworkKind = 'mainnet' | 'testnet' | 'devnet' | 'xahau-testnet'

type Network = { url: string; kind: NetworkKind; note?: string }

export const NETWORKS: readonly Network[] = [
  // The first mainnet entry is the default
  { url: 'wss://xrplcluster.com/', kind: 'mainnet', note: 'InFTF, full history' },
  { url: 'wss://xrpl.ws/', kind: 'mainnet', note: 'alias of xrplcluster.com' },
  { url: 'wss://s1.ripple.com/', kind: 'mainnet', note: 'general purpose' },
  { url: 'wss://s2.ripple.com/', kind: 'mainnet', note: 'full history' },
  { url: 'wss://honeycluster.io/', kind: 'mainnet', note: 'full history, Clio' },
  { url: 'wss://s.altnet.rippletest.net:51233/', kind: 'testnet' },
  { url: 'wss://clio.altnet.rippletest.net:51233/', kind: 'testnet' },
  { url: 'wss://testnet.honeycluster.io/', kind: 'testnet' },
  { url: 'wss://testnet.xrpl-labs.com/', kind: 'testnet' },
  { url: 'wss://s.devnet.rippletest.net:51233/', kind: 'devnet' },
  { url: 'wss://clio.devnet.rippletest.net:51233/', kind: 'devnet' },
  { url: 'wss://devnet.honeycluster.io/', kind: 'devnet' },
  { url: 'wss://xahau-test.net/', kind: 'xahau-testnet', note: 'Hooks-enabled' },
]

/** Lowercases scheme and host and drops the trailing slash. Returns undefined for anything that is not a URL. */
export const normalizeNetworkUrl = (url: string): string | undefined => {
  try {
    const { protocol, host, pathname, search } = new URL(url.trim())
    return `${protocol}//${host}${pathname.replace(/\/+$/, '')}${search}`
  } catch {
    return undefined
  }
}

/** The kind of a known network, whatever the spelling of its URL; undefined for an unknown one. */
export const networkKind = (url: string): NetworkKind | undefined => {
  const normalized = normalizeNetworkUrl(url)
  return normalized === undefined ? undefined : NETWORKS.find(n => normalizeNetworkUrl(n.url) === normalized)?.kind
}

const urlsOf = (kinds: readonly NetworkKind[]) => NETWORKS.filter(n => kinds.includes(n.kind)).map(n => n.url)

// Read from the process environment on every call and never from tool input, so a prompt cannot unlock a network.
const extraTestNetworks = () => (process.env.XRPL_EXTRA_TEST_NETWORKS ?? '').split(',')

/** Whether a wallet seed may be used on this network URL. Fails closed for anything unknown. */
export const isTestNetwork = (network: string): boolean => {
  const kind = networkKind(network)
  if (kind !== undefined) return kind !== 'mainnet'

  const normalized = normalizeNetworkUrl(network)
  return normalized !== undefined && extraTestNetworks().some(url => normalizeNetworkUrl(url) === normalized)
}

/** Throws unless a wallet seed may be used on this network. Call before connecting to the network. */
export const assertSeedAllowed = (network: string): void => {
  if (!isTestNetwork(network)) {
    throw new Error(
      `Wallet seeds are refused on ${network} because it is not a known test network. ` +
        `On mainnet, sign the transaction yourself and submit the signed blob with submit-signed-blob. ` +
        `For a custom test network, add its URL to the XRPL_EXTRA_TEST_NETWORKS environment variable (comma-separated).`,
    )
  }
}

/** "Supported networks: ..." for workflow descriptions. */
export const supportedNetworksText = (kinds: readonly NetworkKind[]) =>
  `Supported networks: ${urlsOf(kinds).join(', ')}.`

/**
 * Network input of a workflow: any spelling of a known URL of one of `kinds` (the workflows need a faucet, so they
 * never run on an extra test network).
 */
export const workflowNetworkSchema = (kinds: readonly NetworkKind[], description: string) =>
  z
    .string()
    .refine(url => kinds.includes(networkKind(url)!), `Must be one of: ${urlsOf(kinds).join(', ')}`)
    .describe(`${description}. ${supportedNetworksText(kinds)}`)

const listed = (kind: NetworkKind) =>
  NETWORKS.filter(n => n.kind === kind)
    .map(n => (n.note ? `${n.url} (${n.note})` : n.url))
    .join(', ')

/** The network section of the agent instructions. */
export const networkInstructions = () => {
  const [defaultMainnet] = NETWORKS.filter(n => n.kind === 'mainnet')
  return [
    `- Default: mainnet via ${defaultMainnet.url}. Use the user's URL if they give one.`,
    `- Mainnet: ${listed('mainnet')}`,
    `- Testnet: ${listed('testnet')}`,
    `- Devnet: ${listed('devnet')}`,
    `- Xahau Testnet: ${listed('xahau-testnet')}`,
  ].join('\n    ')
}
