import { createTool } from '@mastra/core/tools'
import { ECDSA, FundingOptions, Wallet } from 'xrpl'
import { z } from 'zod'
import { getXrplClient } from '../../../helpers'

export const createWalletTool = createTool({
  id: 'create-wallet',
  description: `Create a new XRPL wallet with public/private key pair. This is an off-chain operation that doesn't depend on any network.

XRPL supports only two cryptographic algorithms:
- secp256k1: Elliptic curve algorithm (older, more widely supported)
- ed25519: Modern elliptic curve algorithm (faster, more secure, default)

The generated wallet will have:
- r-address: Public address starting with 'r' (e.g., r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59)
- s-seed: Private seed starting with 's' (e.g., sEdTM1uX8pu2do5XvTnutH6HsouMaM2)
- Public/private key pair for signing transactions

Input Parameters:
- algorithm: The cryptographic algorithm to use (ECDSA, optional)
  - If not provided, defaults to ed25519
  - Valid values: 'secp256k1' or 'ed25519'

Important Notes:
- This is an off-chain operation - no network connection required
- The wallet is not automatically funded - you need to add XRP to activate it
- Keep the seed secure - it provides full access to the wallet
- The r-address is safe to share publicly
- The s-seed should never be shared or stored insecurely
- Wallet generation is deterministic but cryptographically secure`,
  inputSchema: z.object({
    algorithm: z.enum(['secp256k1', 'ed25519']),
  }),
  execute: async ({ context }) => {
    const { algorithm } = context

    // Mastra raises an export from xrpl (which should work fine) error by using ECDSA.secp256k1, so we need to use the string value
    const algo = algorithm === 'ed25519' ? 'ed25519' : 'ecdsa-secp256k1'

    return Wallet.generate(algo as ECDSA)
  },
})

export const fundWalletWithFaucetTool = createTool({
  id: 'fund-wallet-with-faucet',
  description: `Fund a wallet with XRP using a faucet. This operation is only available on testnet networks (testnet, devnet, and other test networks) and is not possible on mainnet.

Default Network:
- Use a testnet network with the correct websocket URL if no network is provided by the user.

Input Parameters:
- network: The testnet network to use. Use the websocket URL to get the correct xrpl client. This network is not needed for the fundWallet function. (string, required)
- wallet: Optional wallet to fund (Wallet object, optional)
- opts: Optional funding configuration (FundingOptions, optional)

Optional Funding Options (opts):
- amount: Custom amount to fund in XRP (string, optional, default: 10)
  - Must be provided as a string representing XRP amount (e.g., "100", "50.5")
  - Do NOT convert to drops - provide the XRP amount directly
  - Examples: "10", "100", "50", "1000"
  - If not specified, defaults to 10 XRP
  - The minimum amount is 1 XRP, if you provide a value less than 1, it will be rounded up to 1 XRP
  - Decimal amounts are rounded up using Math.ceil (e.g., "50.1" becomes "51", "50.9" becomes "51")
  - The amount is automatically converted to a string representation of an integer
- faucetHost: Custom host for faucet server (string, optional)
  - On devnet, testnet, AMM devnet, and HooksV3 testnet, the correct server is determined automatically
  - Use this to customize the faucet host in other environments
- faucetPath: Custom path for faucet server (string, optional)
  - Example: '/accounts' for 'faucet.altnet.rippletest.net/accounts'
  - On devnet, testnet, AMM devnet, and HooksV3 testnet, the correct path is determined automatically
  - Use this to customize the faucet path in other environments
- usageContext: Optional field to indicate the use case context of the faucet transaction (string, optional)
  - Examples: 'integration test', 'code snippets'

Important Notes:
- This operation is NOT available on mainnet - faucets only exist on test networks
- The default funding amount is 10 XRP if not specified but can vary by network and faucet
- Faucet servers automatically determine the correct host and path for supported test networks
- Custom faucet hosts and paths can be specified for other environments
- The wallet must be a valid XRPL wallet object
- Funding may take a few seconds to complete
- Some test networks may have rate limits or availability restrictions`,
  inputSchema: z.object({
    network: z.string(),
    seed: z.string().optional(),
    opts: z.custom<FundingOptions>().optional(),
  }),
  execute: async ({ context, mastra }) => {
    const { network, seed, opts } = context

    const logger = mastra?.getLogger()

    const client = await getXrplClient(network)

    const options = {
      ...opts,
      // amount must be a string representation of an integer
      amount: opts?.amount ? `${Math.ceil(Number(opts.amount))}` : '10',
    }

    // If a wallet is provided
    if (seed) {
      const walletInstance = Wallet.fromSeed(seed)

      logger?.info(
        `Funding wallet ${walletInstance.address} with the following options: ${JSON.stringify(options)} on ${network}`,
      )

      const fundedWallet = await client.fundWallet(walletInstance, options)

      logger?.info(`Wallet ${walletInstance.address} funded successfully`)

      return fundedWallet
    }

    // Otherwise create a new wallet
    logger?.info(`No wallet provided, creating a new one`)

    const { wallet: newWallet } = await client.fundWallet(null, opts)

    logger?.info(`Wallet ${newWallet.address} funded successfully`)

    return newWallet
  },
})
