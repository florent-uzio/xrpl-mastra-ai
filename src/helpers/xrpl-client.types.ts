// https://xrpl.org/public-servers.html
export const networks = {
  mainnet: 'wss://s2.ripple.com',
  testnet: 'wss://s.altnet.rippletest.net:51233',
  devnet: 'wss://s.devnet.rippletest.net:51233',
} as const

export type XrplNetwork = keyof typeof networks | (string & {})
