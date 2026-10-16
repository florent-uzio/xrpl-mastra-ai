import { createStep, createWorkflow } from '@mastra/core/workflows'
import { AccountSet, AccountSetAsfFlags, convertStringToHex, Payment, TrustSet, TxResponse } from 'xrpl'
import { currencyCodeToHex, getXrplClient } from '../../helpers'
import { settingsSchema, iouIssuanceWorkflowSchema, TxnResult, walletsSchema } from './iou-issuance-workflow.types'

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error')

const toTxnResult = (description: string, response: TxResponse): TxnResult => ({
  description,
  hash: response.result.hash,
  // @ts-expect-error - TransactionResult is an object here
  status: response.result.meta.TransactionResult ?? 'N/A',
})

/** Step 1: creates and funds the issuer and holder wallets. */
const createWallets = createStep({
  id: 'create-wallets',
  description: 'Creates and funds wallets for the issuer and all token holders',
  inputSchema: iouIssuanceWorkflowSchema,
  outputSchema: walletsSchema,
  execute: async ({ inputData, mastra }) => {
    const { network, holders: numHolders } = inputData

    try {
      const client = await getXrplClient(network, mastra)
      const [issuer, ...holders] = await Promise.all(
        Array.from({ length: numHolders + 1 }, async () => (await client.fundWallet()).wallet),
      )

      return { ...inputData, issuer, holders }
    } catch (error) {
      throw new Error(`Failed to create wallets: ${errorMessage(error)}`)
    }
  },
})

/** Step 2: sets the issuer account flags, one AccountSet per flag. Skipped when no flags are given. */
const setupIssuerAccount = createStep({
  id: 'setup-issuer-account',
  description: 'Configures the issuer account with specified flags and settings',
  inputSchema: walletsSchema,
  outputSchema: settingsSchema,
  execute: async ({ inputData, mastra }) => {
    const { issuer, network, issuerSettings } = inputData
    const flags = issuerSettings.flags ?? []

    if (flags.length === 0) {
      return { ...inputData, txnResults: [] }
    }

    try {
      const client = await getXrplClient(network, mastra)
      const txnResults: TxnResult[] = []

      // Sequential: same account, so transactions must not race on the sequence number
      for (const [i, flag] of flags.entries()) {
        const flagValue = AccountSetAsfFlags[flag]

        const tx: AccountSet = {
          TransactionType: 'AccountSet',
          Account: issuer.address,
          // The domain only needs to be set once
          Domain: i === 0 && issuerSettings.domain ? convertStringToHex(issuerSettings.domain) : undefined,
          SetFlag: flagValue,
        }

        const response = await client.submitAndWait(tx, { autofill: true, wallet: issuer })
        txnResults.push(toTxnResult(`Set flag ${flag} (${flagValue})`, response))
      }

      return { ...inputData, txnResults }
    } catch (error) {
      throw new Error(`Failed to setup issuer account: ${errorMessage(error)}`)
    }
  },
})

/** Step 3: each holder creates a trust line to the issuer. Replaces the currency code with its hex form. */
const createTrustLines = createStep({
  id: 'create-trust-lines',
  description: 'Creates trust lines between holders and issuer for the token',
  inputSchema: settingsSchema,
  outputSchema: settingsSchema,
  execute: async ({ inputData, mastra }) => {
    const { issuer, holders, network, trustline, txnResults } = inputData

    try {
      const currencyHex = currencyCodeToHex(trustline.currency)
      const client = await getXrplClient(network, mastra)

      // Parallel: each holder signs with its own wallet
      const results = await Promise.all(
        holders.map(async holder => {
          const tx: TrustSet = {
            TransactionType: 'TrustSet',
            Account: holder.address,
            LimitAmount: { currency: currencyHex, issuer: issuer.address, value: trustline.trustlineLimit },
          }
          const response = await client.submitAndWait(tx, { autofill: true, wallet: holder })
          return toTxnResult(`Created trust line for ${holder.address}`, response)
        }),
      )

      return {
        ...inputData,
        trustline: { ...trustline, currency: currencyHex },
        txnResults: [...txnResults, ...results],
      }
    } catch (error) {
      throw new Error(`Failed to create trust lines: ${errorMessage(error)}`)
    }
  },
})

/** Step 4: the issuer pays `mintAmount` to each holder. */
const mintTokens = createStep({
  id: 'mint-tokens',
  description: 'Mints tokens by sending payments from issuer to holders',
  inputSchema: settingsSchema,
  outputSchema: settingsSchema,
  execute: async ({ inputData, mastra }) => {
    const { issuer, holders, network, mintAmount, trustline, txnResults } = inputData

    try {
      const client = await getXrplClient(network, mastra)
      const results: TxnResult[] = []

      // Sequential: same sender account (sequence numbers)
      for (const holder of holders) {
        const tx: Payment = {
          TransactionType: 'Payment',
          Account: issuer.address,
          Destination: holder.address,
          Amount: { currency: trustline.currency, value: mintAmount, issuer: issuer.address },
        }

        const response = await client.submitAndWait(tx, { autofill: true, wallet: issuer })
        results.push(toTxnResult(`Minted ${mintAmount} ${trustline.currency} to ${holder.address}`, response))
      }

      return { ...inputData, txnResults: [...txnResults, ...results] }
    } catch (error) {
      throw new Error(`Failed to mint tokens: ${errorMessage(error)}`)
    }
  },
})

/**
 * Issues an IOU (trust line token) on the XRPL: create wallets -> set issuer flags -> create trust lines -> mint.
 * Not for MPTs (MPTokenIssuance), which use a different flow.
 */
const iouIssuanceWorkflow = createWorkflow({
  id: 'iou-issuance-workflow',
  description: `Issues an IOU (trust line token, e.g. a stablecoin-style currency) on an XRPL testnet or devnet: creates and funds an issuer and N holder wallets, sets issuer flags/domain, creates trust lines, and mints IOUs to each holder. Not for MPTs (Multi-Purpose Tokens).
Supported networks: wss://s.altnet.rippletest.net:51233/, wss://testnet.xrpl-labs.com/, wss://s.devnet.rippletest.net:51233/, wss://clio.devnet.rippletest.net:51233/.`,
  inputSchema: iouIssuanceWorkflowSchema,
  outputSchema: settingsSchema,
})
  .then(createWallets)
  .then(setupIssuerAccount)
  .then(createTrustLines)
  .then(mintTokens)

iouIssuanceWorkflow.commit()

export { iouIssuanceWorkflow }
