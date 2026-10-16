import { createTool } from '@mastra/core/tools'
import { ECDSA, Wallet } from 'xrpl'
import { z } from 'zod'
import { getXrplClient, networkSchema, xrplAddressSchema } from '../../../helpers'

const walletOutputSchema = z.object({
  address: xrplAddressSchema.describe('Classic address, safe to share'),
  seed: z.string().optional().describe('SECRET: required to sign transactions'),
  publicKey: z.string(),
  privateKey: z.string().describe('SECRET'),
})

const toWalletOutput = (wallet: Wallet) => ({
  address: wallet.classicAddress,
  seed: wallet.seed,
  publicKey: wallet.publicKey,
  privateKey: wallet.privateKey,
})

export const createWalletTool = createTool({
  id: 'create-wallet',
  description: `Generate a new XRPL wallet (address, seed, keys) locally. No network call and the wallet is not funded or activated on-ledger.

Input:
- algorithm: "ed25519" (default) or "secp256k1"

Treat the seed as a secret. Only the address is safe to share.`,
  inputSchema: z.object({
    algorithm: z.enum(['secp256k1', 'ed25519']).default('ed25519').describe('Key algorithm'),
  }),
  outputSchema: walletOutputSchema,
  execute: async inputData => {
    const { algorithm } = inputData

    // Mastra raises an export from xrpl (which should work fine) error by using ECDSA.secp256k1, so we need to use the string value
    const algo = algorithm === 'ed25519' ? 'ed25519' : 'ecdsa-secp256k1'

    return toWalletOutput(Wallet.generate(algo as ECDSA))
  },
})

export const fundWalletWithFaucetTool = createTool({
  id: 'fund-wallet-with-faucet',
  description: `Fund a wallet with test XRP from a faucet. Testnet/devnet only, never mainnet. If no network is given, use a testnet websocket URL.

Input:
- network: testnet websocket URL (required)
- seed: wallet to fund (optional). If omitted, a new funded wallet is created.
- opts.amount: XRP amount as a string, not drops. Default "10". Fractions are rounded up. (optional)
- opts.faucetHost / opts.faucetPath: only for custom faucets (optional)

Funding can take a few seconds.`,
  inputSchema: z.object({
    network: networkSchema.describe('Testnet or devnet websocket URL, never mainnet'),
    seed: z.string().optional().describe('Seed of the wallet to fund. If omitted, a new funded wallet is created.'),
    opts: z
      .object({
        amount: z
          .string()
          .regex(/^\d+(\.\d+)?$/)
          .optional()
          .describe('XRP amount (not drops), default "10". Fractions are rounded up.'),
        faucetHost: z.string().optional().describe('Custom faucet host'),
        faucetPath: z.string().optional().describe('Custom faucet path'),
      })
      .optional(),
  }),
  outputSchema: walletOutputSchema.extend({
    balance: z.number().describe('XRP balance after funding'),
  }),
  execute: async (inputData, { mastra }) => {
    const { network, seed, opts } = inputData

    const logger = mastra?.getLogger()

    const client = await getXrplClient(network, mastra)

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

      return { ...toWalletOutput(fundedWallet.wallet), balance: fundedWallet.balance }
    }

    // Otherwise create a new wallet
    logger?.info(`No wallet provided, creating a new one`)

    const { wallet: newWallet, balance } = await client.fundWallet(null, options)

    logger?.info(`Wallet ${newWallet.address} funded successfully`)

    return { ...toWalletOutput(newWallet), balance }
  },
})
