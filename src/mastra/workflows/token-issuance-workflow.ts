import { createStep, createWorkflow } from '@mastra/core/workflows'
import { AccountSet, Payment, TrustSet } from 'xrpl'
import { z } from 'zod'
import { currencyStringToHex, getXrplClient } from '../../helpers'
import {
  AccountSetAsfFlagsMap,
  settingsSchema,
  tokenIssuanceWorkflowSchema,
  TxnResult,
  walletsSchema,
} from './token-issuance-workflow.types'

// Step 1: Create wallets for issuer and holders
const createWallets = createStep({
  id: 'create-wallets',
  description: 'Creates wallets for the issuer and all token holders',
  inputSchema: tokenIssuanceWorkflowSchema,
  outputSchema: walletsSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found')
    }

    const { network, holders: numHolders, ...rest } = inputData

    const client = await getXrplClient(network)

    const issuerPromise = client.fundWallet()
    const holdersPromises = Array.from({ length: numHolders }, async () => {
      const { wallet } = await client.fundWallet()
      return wallet
    })

    const [issuer, ...holders] = await Promise.all([issuerPromise, ...holdersPromises])

    return {
      issuer: issuer.wallet,
      holders: holders,
      network,
      ...rest,
    }
  },
})

// Step 2: Setup issuer account
const setupIssuerAccount = createStep({
  id: 'setup-issuer-account',
  description: 'Sets required flags for the issuer account, including asfDefaultRipple',
  inputSchema: walletsSchema,
  outputSchema: settingsSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found')
    }

    const { issuer, network, issuerSettings, ...rest } = inputData

    if (!issuerSettings.flags) {
      return {
        issuer,
        network,
        issuerSettings,
        txnResults: [],
        ...rest,
      }
    }

    const client = await getXrplClient(network)

    const txnResults: TxnResult[] = []

    for (const flag of issuerSettings.flags) {
      const tx: AccountSet = {
        TransactionType: 'AccountSet',
        Account: issuer.address,
        SetFlag: AccountSetAsfFlagsMap[flag as keyof typeof AccountSetAsfFlagsMap],
      }

      const response = await client.submitAndWait(tx, { autofill: true, wallet: issuer })

      const txnResult: TxnResult = {
        description: `Set flag ${response.result.tx_json.SetFlag}`,
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
  },
})

// Step 3: Create trust lines between holders and issuer
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

    // update the trustline object currency field to hex
    trustline.currency = currencyStringToHex(trustline.currency)

    const client = await getXrplClient(network)

    const txnResults: TxnResult[] = []

    // Create trust line transactions for each holder
    const promises = holders.map(async holder => {
      const tx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: holder.address,
        LimitAmount: {
          currency: trustline.currency,
          issuer: issuer.address,
          value: trustline.trustlineLimit,
        },
      }

      return await client.submitAndWait(tx, { autofill: true, wallet: holder })
    })

    const responses = await Promise.all(promises)

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
      trustline,
      ...rest,
      // Reassign txnResults to the output schema
      txnResults,
    }
  },
})

// Step 4: Mint tokens by sending payments from issuer to holders
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

    const client = await getXrplClient(network)

    const txnResults: TxnResult[] = []

    // Create mint transactions for each holder
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
        description: `Minted tokens to ${holder.address}`,
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
  },
})

// Main workflow
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
  outputSchema: z.object({
    network: z.string(),
  }),
})
  .then(createWallets)
  .then(setupIssuerAccount)
  .then(createTrustLines)
  .then(mintTokens)

//   .then(generateSummary)

tokenIssuanceWorkflow.commit()

export { tokenIssuanceWorkflow }
