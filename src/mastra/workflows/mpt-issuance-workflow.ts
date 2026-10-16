import { createStep, createWorkflow } from '@mastra/core/workflows'
import {
  encodeMPTokenMetadata,
  MPTokenAuthorize,
  MPTokenIssuanceCreate,
  MPTokenIssuanceCreateFlags,
  Payment,
} from 'xrpl'
import { getXrplClient, saveFlowRecord, toWalletRecord } from '../../helpers'
import {
  issuedSchema,
  mptIssuanceResultSchema,
  mptIssuanceWorkflowSchema,
  walletsSchema,
} from './mpt-issuance-workflow.types'
import { assertTxnSuccess, errorMessage, fundWallets, toTxnResult, TxnResult } from './shared'

/** Step 1: creates and funds the issuer and holder wallets. */
const createWallets = createStep({
  id: 'create-wallets',
  description: 'Creates and funds wallets for the issuer and all MPT holders',
  inputSchema: mptIssuanceWorkflowSchema,
  outputSchema: walletsSchema,
  execute: async ({ inputData, mastra }) => {
    try {
      const [issuer, ...holders] = await fundWallets(inputData.network, inputData.holders + 1, mastra)

      return { ...inputData, issuer, holders }
    } catch (error) {
      throw new Error(`Failed to create wallets: ${errorMessage(error)}`)
    }
  },
})

/** Step 2: the issuer creates the MPT issuance and we read its MPTokenIssuanceID from the metadata. */
const createIssuance = createStep({
  id: 'create-issuance',
  description: 'Creates the MPT issuance with the requested flags and properties',
  inputSchema: walletsSchema,
  outputSchema: issuedSchema,
  execute: async ({ inputData, mastra }) => {
    const { issuer, network, issuance } = inputData

    try {
      const client = await getXrplClient(network, mastra)

      const tx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: issuer.address,
        Flags: (issuance.flags ?? []).reduce((acc, flag) => acc | MPTokenIssuanceCreateFlags[flag], 0),
        AssetScale: issuance.assetScale,
        MaximumAmount: issuance.maximumAmount,
        TransferFee: issuance.transferFee,
        MPTokenMetadata: issuance.metadata ? encodeMPTokenMetadata(issuance.metadata) : undefined,
      }

      const response = await client.submitAndWait(tx, { autofill: true, wallet: issuer })
      const result = assertTxnSuccess(toTxnResult('Created MPT issuance', response))

      const { mpt_issuance_id } = response.result.meta as { mpt_issuance_id?: string }
      if (!mpt_issuance_id) {
        throw new Error(`MPTokenIssuanceID missing from the metadata of ${result.hash}`)
      }

      return { ...inputData, mptIssuanceId: mpt_issuance_id, txnResults: [result] }
    } catch (error) {
      throw new Error(`Failed to create MPT issuance: ${errorMessage(error)}`)
    }
  },
})

/** Step 3: each holder opts in to the MPT, which creates their MPToken object. */
const holdersOptIn = createStep({
  id: 'holders-opt-in',
  description: 'Each holder opts in to the MPT with MPTokenAuthorize',
  inputSchema: issuedSchema,
  outputSchema: issuedSchema,
  execute: async ({ inputData, mastra }) => {
    const { holders, network, mptIssuanceId, txnResults } = inputData

    try {
      const client = await getXrplClient(network, mastra)

      // Parallel: each holder signs with its own wallet
      const results = await Promise.all(
        holders.map(async holder => {
          const tx: MPTokenAuthorize = {
            TransactionType: 'MPTokenAuthorize',
            Account: holder.address,
            MPTokenIssuanceID: mptIssuanceId,
          }
          const response = await client.submitAndWait(tx, { autofill: true, wallet: holder })
          return assertTxnSuccess(toTxnResult(`Holder ${holder.address} opted in`, response))
        }),
      )

      return { ...inputData, txnResults: [...txnResults, ...results] }
    } catch (error) {
      throw new Error(`Failed to opt holders in: ${errorMessage(error)}`)
    }
  },
})

/** Step 4: the issuer authorizes each holder. Only needed (and skipped otherwise) with tfMPTRequireAuth. */
const authorizeHolders = createStep({
  id: 'authorize-holders',
  description: 'The issuer authorizes each holder. Skipped unless the issuance has tfMPTRequireAuth',
  inputSchema: issuedSchema,
  outputSchema: issuedSchema,
  execute: async ({ inputData, mastra }) => {
    const { issuer, holders, network, issuance, mptIssuanceId, txnResults } = inputData

    if (!issuance.flags?.includes('tfMPTRequireAuth')) {
      return inputData
    }

    try {
      const client = await getXrplClient(network, mastra)
      const results: TxnResult[] = []

      // Sequential: same sender account (sequence numbers)
      for (const holder of holders) {
        const tx: MPTokenAuthorize = {
          TransactionType: 'MPTokenAuthorize',
          Account: issuer.address,
          MPTokenIssuanceID: mptIssuanceId,
          Holder: holder.address,
        }
        const response = await client.submitAndWait(tx, { autofill: true, wallet: issuer })
        results.push(assertTxnSuccess(toTxnResult(`Authorized holder ${holder.address}`, response)))
      }

      return { ...inputData, txnResults: [...txnResults, ...results] }
    } catch (error) {
      throw new Error(`Failed to authorize holders: ${errorMessage(error)}`)
    }
  },
})

/** Step 5: the issuer pays `mintAmount` of the MPT to each holder. */
const mintTokens = createStep({
  id: 'mint-tokens',
  description: 'Mints the MPT by sending payments from the issuer to the holders',
  inputSchema: issuedSchema,
  outputSchema: issuedSchema,
  execute: async ({ inputData, mastra }) => {
    const { issuer, holders, network, mintAmount, mptIssuanceId, txnResults } = inputData

    try {
      const client = await getXrplClient(network, mastra)
      const results: TxnResult[] = []

      // Sequential: same sender account (sequence numbers)
      for (const holder of holders) {
        const tx: Payment = {
          TransactionType: 'Payment',
          Account: issuer.address,
          Destination: holder.address,
          Amount: { mpt_issuance_id: mptIssuanceId, value: mintAmount },
        }
        const response = await client.submitAndWait(tx, { autofill: true, wallet: issuer })
        results.push(assertTxnSuccess(toTxnResult(`Minted ${mintAmount} to ${holder.address}`, response)))
      }

      return { ...inputData, txnResults: [...txnResults, ...results] }
    } catch (error) {
      throw new Error(`Failed to mint MPT: ${errorMessage(error)}`)
    }
  },
})

/** Step 6: saves the wallets (with seeds), the MPTokenIssuanceID and the transaction hashes to a record file. */
const recordResults = createStep({
  id: 'record-results',
  description: 'Saves the wallets, MPTokenIssuanceID and transaction results of this run to a record file',
  inputSchema: issuedSchema,
  outputSchema: mptIssuanceResultSchema,
  execute: async ({ inputData }) => {
    const { issuer, holders, network, issuance, mintAmount, mptIssuanceId, txnResults } = inputData

    try {
      const { record, path } = await saveFlowRecord({
        flow: 'mpt-issuance',
        network,
        data: {
          mptIssuanceId,
          issuer: toWalletRecord(issuer),
          holders: holders.map(toWalletRecord),
          issuance,
          mintAmount,
          txnResults,
        },
      })

      return { ...inputData, recordId: record.id, recordPath: path }
    } catch (error) {
      throw new Error(`Failed to save the record: ${errorMessage(error)}`)
    }
  },
})

/**
 * Issues an MPT (Multi-Purpose Token) on the XRPL:
 * create wallets -> create issuance -> holders opt in -> issuer authorizes holders (tfMPTRequireAuth only) -> mint -> record.
 * Not for IOUs (trust line tokens), which use the iou-issuance-workflow.
 */
const mptIssuanceWorkflow = createWorkflow({
  id: 'mpt-issuance-workflow',
  description: `Issues an MPT (Multi-Purpose Token) on an XRPL testnet or devnet: creates and funds an issuer and N holder wallets, creates the MPT issuance with the requested flags and properties (e.g. tfMPTRequireAuth, tfMPTCanTransfer, transfer fee, max supply, metadata), has each holder opt in, authorizes holders when tfMPTRequireAuth is set, mints to each holder, then saves a record (wallet addresses and seeds, MPTokenIssuanceID, tx hashes) retrievable with the get-flow-records tool. Not for IOUs (trust line tokens).
Supported networks: wss://s.altnet.rippletest.net:51233/, wss://testnet.xrpl-labs.com/, wss://s.devnet.rippletest.net:51233/, wss://clio.devnet.rippletest.net:51233/.`,
  inputSchema: mptIssuanceWorkflowSchema,
  outputSchema: mptIssuanceResultSchema,
})
  .then(createWallets)
  .then(createIssuance)
  .then(holdersOptIn)
  .then(authorizeHolders)
  .then(mintTokens)
  .then(recordResults)

mptIssuanceWorkflow.commit()

export { mptIssuanceWorkflow }
