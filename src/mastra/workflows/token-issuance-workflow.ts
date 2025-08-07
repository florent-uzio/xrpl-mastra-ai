import { createStep, createWorkflow } from '@mastra/core/workflows'
import { AccountSet, convertStringToHex, Payment, TrustSet } from 'xrpl'
import { currencyCodeToHex, getXrplClient } from '../../helpers'
import {
  AccountSetAsfFlagsMap,
  settingsSchema,
  tokenIssuanceWorkflowSchema,
  TxnResult,
  walletsSchema,
} from './token-issuance-workflow.types'

/**
 * Step 1: Create Wallets
 *
 * Creates and funds wallets for the issuer and all token holders.
 * This step establishes the foundation for the token issuance process.
 *
 * Input: Workflow parameters (network, holders count, etc.)
 * Output: Wallets schema with issuer and holder wallets
 */
const createWallets = createStep({
  id: 'create-wallets',
  description: 'Creates and funds wallets for the issuer and all token holders',
  inputSchema: tokenIssuanceWorkflowSchema,
  outputSchema: walletsSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found')
    }

    const { network, holders: numHolders, ...rest } = inputData

    try {
      const client = await getXrplClient(network, mastra)

      // Create issuer wallet
      const issuerPromise = client.fundWallet()

      // Create holder wallets in parallel
      const holdersPromises = Array.from({ length: numHolders }, async () => {
        const { wallet } = await client.fundWallet()
        return wallet
      })

      // Wait for all wallets to be created and funded
      const [issuer, ...holders] = await Promise.all([issuerPromise, ...holdersPromises])

      return {
        issuer: issuer.wallet,
        holders: holders,
        network,
        ...rest,
      }
    } catch (error) {
      throw new Error(`Failed to create wallets: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
})

/**
 * Step 2: Setup Issuer Account
 *
 * Configures the issuer account with specified flags and settings.
 * This step is optional - if no flags are provided, it returns the data unchanged.
 *
 * Input: Wallets schema with issuer and holder wallets
 * Output: Settings schema with transaction results
 */
const setupIssuerAccount = createStep({
  id: 'setup-issuer-account',
  description: 'Configures the issuer account with specified flags and settings',
  inputSchema: walletsSchema,
  outputSchema: settingsSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found')
    }

    const { issuer, network, issuerSettings, ...rest } = inputData

    // If no flags are specified, skip account configuration
    if (!issuerSettings.flags || issuerSettings.flags.length === 0) {
      return {
        issuer,
        network,
        issuerSettings,
        txnResults: [],
        ...rest,
      }
    }

    try {
      const client = await getXrplClient(network, mastra)
      const txnResults: TxnResult[] = []

      // Process each flag sequentially to avoid conflicts
      for (const flag of issuerSettings.flags) {
        const flagValue = AccountSetAsfFlagsMap[flag as keyof typeof AccountSetAsfFlagsMap]

        if (!flagValue) {
          throw new Error(`Invalid flag: ${flag}`)
        }

        const tx: AccountSet = {
          TransactionType: 'AccountSet',
          Account: issuer.address,
          Domain: issuerSettings.domain ? convertStringToHex(issuerSettings.domain) : undefined,
          SetFlag: flagValue,
        }

        const response = await client.submitAndWait(tx, { autofill: true, wallet: issuer })

        const txnResult: TxnResult = {
          description: `Set flag ${flag} (${flagValue})`,
          hash: response.result.hash,
          // @ts-expect-error - TransactionResult is an object here
          status: response.result.meta.TransactionResult ?? 'N/A',
        }

        txnResults.push(txnResult)
      }

      return {
        issuer,
        network,
        issuerSettings,
        txnResults,
        ...rest,
      }
    } catch (error) {
      throw new Error(`Failed to setup issuer account: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
})

/**
 * Step 3: Create Trust Lines
 *
 * Creates trust lines between holders and the issuer for the specified token.
 * Each holder creates a trust line to accept tokens from the issuer.
 *
 * Input: Settings schema with wallets and configuration
 * Output: Settings schema with trust line transaction results
 */
const createTrustLines = createStep({
  id: 'create-trust-lines',
  description: 'Creates trust lines between holders and issuer for the token',
  inputSchema: settingsSchema,
  outputSchema: settingsSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found')
    }

    const { issuer, holders, network, trustline, ...rest } = inputData

    try {
      // Convert currency string to hex format for XRPL
      const currencyHex = currencyCodeToHex(trustline.currency)

      const client = await getXrplClient(network, mastra)
      const txnResults: TxnResult[] = []

      // Create trust line transactions for each holder in parallel
      const trustLinePromises = holders.map(async holder => {
        const tx: TrustSet = {
          TransactionType: 'TrustSet',
          Account: holder.address,
          LimitAmount: {
            currency: currencyHex,
            issuer: issuer.address,
            value: trustline.trustlineLimit,
          },
        }

        return await client.submitAndWait(tx, { autofill: true, wallet: holder })
      })

      const responses = await Promise.all(trustLinePromises)

      // Process transaction results
      for (const response of responses) {
        const txnResult: TxnResult = {
          description: `Created trust line for ${response.result.tx_json.LimitAmount.issuer}`,
          hash: response.result.hash,
          // @ts-expect-error - TransactionResult is an object here
          status: response.result.meta.TransactionResult ?? 'N/A',
        }
        txnResults.push(txnResult)
      }

      return {
        issuer,
        holders,
        network,
        trustline: { ...trustline, currency: currencyHex },
        ...rest,
        txnResults,
      }
    } catch (error) {
      throw new Error(`Failed to create trust lines: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
})

/**
 * Step 4: Mint Tokens
 *
 * Mints tokens by sending payments from the issuer to each holder.
 * This creates the actual token supply and distributes it to holders.
 *
 * Input: Settings schema with wallets, trust lines, and configuration
 * Output: Settings schema with mint transaction results
 */
const mintTokens = createStep({
  id: 'mint-tokens',
  description: 'Mints tokens by sending payments from issuer to holders',
  inputSchema: settingsSchema,
  outputSchema: settingsSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found')
    }

    const { issuer, holders, network, mintAmount, trustline, ...rest } = inputData

    try {
      const client = await getXrplClient(network, mastra)
      const txnResults: TxnResult[] = []

      // Mint tokens for each holder sequentially to avoid rate limiting
      for (const holder of holders) {
        const tx: Payment = {
          TransactionType: 'Payment',
          Account: issuer.address,
          Destination: holder.address,
          Amount: {
            currency: trustline.currency,
            value: mintAmount,
            issuer: issuer.address,
          },
        }

        const response = await client.submitAndWait(tx, { autofill: true, wallet: issuer })

        const txnResult: TxnResult = {
          description: `Minted ${mintAmount} ${trustline.currency} to ${holder.address}`,
          hash: response.result.hash,
          // @ts-expect-error - TransactionResult is an object here
          status: response.result.meta.TransactionResult ?? 'N/A',
        }
        txnResults.push(txnResult)
      }

      return {
        issuer,
        holders,
        network,
        mintAmount,
        trustline,
        ...rest,
        txnResults,
      }
    } catch (error) {
      throw new Error(`Failed to mint tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
})

/**
 * Token Issuance Workflow
 *
 * A complete workflow for issuing tokens on the XRP Ledger.
 * This workflow automates the entire process from wallet creation to token distribution.
 *
 * Workflow Steps:
 * 1. Create Wallets - Creates and funds issuer and holder wallets
 * 2. Setup Issuer Account - Configures issuer account flags (optional)
 * 3. Create Trust Lines - Establishes trust lines for token acceptance
 * 4. Mint Tokens - Distributes tokens to all holders
 */
const tokenIssuanceWorkflow = createWorkflow({
  id: 'token-issuance-workflow',
  description: `Complete token issuance workflow for testnet and devnet networks.
  
  ## Available Networks and WebSocket URLs

    ### Mainnet (Production Networks)
    
    **Non-Commercial (Free Access):**
    - **XRP Ledger Foundation**: wss://xrplcluster.com/ or wss://xrpl.ws/
      - Full history server cluster with CORS support
      - Recommended for general use
    - **Ripple (General Purpose)**: wss://s1.ripple.com/
      - General purpose server cluster
    - **Ripple (Full History)**: wss://s2.ripple.com/
      - Full-history server cluster

    **Commercial (Paid Access):**
    - **XRP Ledger Foundation via Dhali**: https://xrplcluster.dhali.io/
      - Requires paid API key in Payment-Claim header
    - **QuickNode**: Various endpoints under free and paid plans

    ### Test Networks (Development/Testing)

    **Testnet:**
    - **Ripple Testnet**: wss://s.altnet.rippletest.net:51233/
    - **XRPL Labs Testnet**: wss://testnet.xrpl-labs.com/
      - Testnet public server with CORS support
    - **Ripple Testnet (Clio)**: wss://clio.altnet.rippletest.net:51233/
      - Testnet public server with Clio

    **Devnet:**
    - **Ripple Devnet**: wss://s.devnet.rippletest.net:51233/
    - **Ripple Devnet (Clio)**: wss://clio.devnet.rippletest.net:51233/
    - **Sidechain-Devnet**: wss://sidechain-net2.devnet.rippletest.net:51233/
      - Sidechain Devnet for testing cross-chain bridge features

    **Specialized Test Networks:**
    - **Xahau Testnet (XRPL Labs)**: wss://xahau-test.net/
      - Hooks-enabled Xahau Testnet`,
  inputSchema: tokenIssuanceWorkflowSchema,
  outputSchema: settingsSchema,
})
  .then(createWallets)
  .then(setupIssuerAccount)
  .then(createTrustLines)
  .then(mintTokens)

// Commit the workflow to make it available
tokenIssuanceWorkflow.commit()

export { tokenIssuanceWorkflow }
