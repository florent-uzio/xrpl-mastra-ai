import { createStep, createWorkflow } from '@mastra/core/workflows'
import {
  LoanBrokerCoverDeposit,
  LoanBrokerSet,
  MPTokenAuthorize,
  MPTokenIssuanceCreate,
  MPTokenIssuanceCreateFlags,
  Payment,
  rippleTimeToISOTime,
  VaultCreate,
  VaultDeposit,
  VaultKind,
  Wallet,
} from 'xrpl'
import { assertSeedAllowed, getXrplClient, saveFlowRecord, toWalletRecord } from '../../helpers'
import {
  issuedSchema,
  lendingSetupResultSchema,
  lendingSetupWorkflowSchema,
  vaultSchema,
  walletsSchema,
} from './lending-setup-workflow.types'
import { assertTxnSuccess, createdEntryId, errorMessage, fundWallets, toTxnResult, TxnResult } from './shared'

/** Step 1: funds the vault owner, depositor and borrower wallets, plus the issuer when a new MPT is created. */
const createWallets = createStep({
  id: 'create-wallets',
  description: 'Creates and funds the issuer (new MPT only), vault owner, depositor and borrower wallets',
  inputSchema: lendingSetupWorkflowSchema,
  outputSchema: walletsSchema,
  execute: async ({ inputData, mastra }) => {
    const { network, issuance } = inputData

    try {
      if (issuance.source === 'existing') {
        assertSeedAllowed(network)
        const [vaultOwner, depositor, borrower] = await fundWallets(network, 3, mastra)
        return { ...inputData, issuer: Wallet.fromSeed(issuance.issuerSeed), vaultOwner, depositor, borrower }
      }

      const [issuer, vaultOwner, depositor, borrower] = await fundWallets(network, 4, mastra)
      return { ...inputData, issuer, vaultOwner, depositor, borrower }
    } catch (error) {
      throw new Error(`Failed to create wallets: ${errorMessage(error)}`)
    }
  },
})

/** Step 2: creates the MPT, or reuses the existing one. Vaults need tfMPTCanTransfer (tecNO_AUTH otherwise). */
const createIssuance = createStep({
  id: 'create-issuance',
  description: 'Creates a transferable MPT issuance, or reuses the existing one',
  inputSchema: walletsSchema,
  outputSchema: issuedSchema,
  execute: async ({ inputData, mastra }) => {
    const { issuer, network, issuance } = inputData

    if (issuance.source === 'existing') {
      return { ...inputData, mptIssuanceId: issuance.mptIssuanceId, txnResults: [] }
    }

    try {
      const client = await getXrplClient(network, mastra)

      const tx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: issuer.address,
        Flags: MPTokenIssuanceCreateFlags.tfMPTCanTransfer,
        AssetScale: issuance.assetScale,
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

/** Step 3: the vault owner, depositor and borrower opt in to the MPT, then the issuer sends `mintAmount` to each. */
const distributeTokens = createStep({
  id: 'distribute-tokens',
  description: 'The vault owner, depositor and borrower opt in to the MPT and receive mintAmount each',
  inputSchema: issuedSchema,
  outputSchema: issuedSchema,
  execute: async ({ inputData, mastra }) => {
    const { issuer, vaultOwner, depositor, borrower, network, mintAmount, mptIssuanceId, txnResults } = inputData
    const holders = [vaultOwner, depositor, borrower]

    try {
      const client = await getXrplClient(network, mastra)

      // Parallel: each holder signs with its own wallet
      const optIns = await Promise.all(
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

      // Sequential: same sender account (sequence numbers)
      const payments: TxnResult[] = []
      for (const holder of holders) {
        const tx: Payment = {
          TransactionType: 'Payment',
          Account: issuer.address,
          Destination: holder.address,
          Amount: { mpt_issuance_id: mptIssuanceId, value: mintAmount },
        }
        const response = await client.submitAndWait(tx, { autofill: true, wallet: issuer })
        payments.push(assertTxnSuccess(toTxnResult(`Sent ${mintAmount} to ${holder.address}`, response)))
      }

      return { ...inputData, txnResults: [...txnResults, ...optIns, ...payments] }
    } catch (error) {
      throw new Error(`Failed to distribute the MPT: ${errorMessage(error)}`)
    }
  },
})

/**
 * Step 4: the vault owner creates a closed-ended vault. The dates are counted from the last validated ledger's
 * close time, not the local clock, because the ledger decides the phase.
 */
const createVault = createStep({
  id: 'create-vault',
  description: 'Creates a closed-ended vault with SubscriptionDate and RedemptionDate counted from ledger time',
  inputSchema: issuedSchema,
  outputSchema: vaultSchema,
  execute: async ({ inputData, mastra }) => {
    const { vaultOwner, network, mptIssuanceId, subscriptionSeconds, investmentSeconds, txnResults } = inputData

    try {
      const client = await getXrplClient(network, mastra)

      const ledger = await client.request({ command: 'ledger', ledger_index: 'validated' })
      const subscriptionDate = ledger.result.ledger.close_time + subscriptionSeconds
      const redemptionDate = subscriptionDate + investmentSeconds

      const tx: VaultCreate = {
        TransactionType: 'VaultCreate',
        Account: vaultOwner.address,
        Asset: { mpt_issuance_id: mptIssuanceId },
        VaultKind: VaultKind.vaultKindClosed,
        SubscriptionDate: subscriptionDate,
        RedemptionDate: redemptionDate,
      }

      const response = await client.submitAndWait(tx, { autofill: true, wallet: vaultOwner })
      const result = assertTxnSuccess(toTxnResult('Created closed-ended vault', response))

      return {
        ...inputData,
        vaultId: createdEntryId(response, 'Vault'),
        subscriptionDate,
        redemptionDate,
        txnResults: [...txnResults, result],
      }
    } catch (error) {
      throw new Error(`Failed to create the vault: ${errorMessage(error)}`)
    }
  },
})

/** Step 5: the depositor deposits into the vault. Only possible before SubscriptionDate (tecEXPIRED after it). */
const depositIntoVault = createStep({
  id: 'deposit-into-vault',
  description: 'The depositor deposits depositAmount into the vault during the Subscription phase',
  inputSchema: vaultSchema,
  outputSchema: vaultSchema,
  execute: async ({ inputData, mastra }) => {
    const { depositor, network, mptIssuanceId, vaultId, depositAmount, txnResults } = inputData

    try {
      const client = await getXrplClient(network, mastra)

      const tx: VaultDeposit = {
        TransactionType: 'VaultDeposit',
        Account: depositor.address,
        VaultID: vaultId,
        Amount: { mpt_issuance_id: mptIssuanceId, value: depositAmount },
      }

      const response = await client.submitAndWait(tx, { autofill: true, wallet: depositor })
      const result = assertTxnSuccess(toTxnResult(`Deposited ${depositAmount} into the vault`, response))

      return { ...inputData, txnResults: [...txnResults, result] }
    } catch (error) {
      throw new Error(`Failed to deposit into the vault: ${errorMessage(error)}`)
    }
  },
})

/** Step 6: the vault owner creates the loan broker on the vault, then deposits its first-loss capital. */
const createLoanBroker = createStep({
  id: 'create-loan-broker',
  description: 'The vault owner creates the LoanBroker and deposits coverAmount as first-loss capital',
  inputSchema: vaultSchema,
  outputSchema: vaultSchema,
  execute: async ({ inputData, mastra }) => {
    const { vaultOwner, network, mptIssuanceId, vaultId, coverAmount, txnResults } = inputData
    const { managementFeeRate, coverRateMinimum, coverRateLiquidation } = inputData

    try {
      const client = await getXrplClient(network, mastra)

      // Sequential: same sender account (sequence numbers), and the cover needs the broker ID
      const brokerTx: LoanBrokerSet = {
        TransactionType: 'LoanBrokerSet',
        Account: vaultOwner.address,
        VaultID: vaultId,
        ManagementFeeRate: managementFeeRate,
        CoverRateMinimum: coverRateMinimum,
        CoverRateLiquidation: coverRateLiquidation,
      }
      const brokerResponse = await client.submitAndWait(brokerTx, { autofill: true, wallet: vaultOwner })
      const brokerResult = assertTxnSuccess(toTxnResult('Created loan broker', brokerResponse))
      const loanBrokerId = createdEntryId(brokerResponse, 'LoanBroker')

      const coverTx: LoanBrokerCoverDeposit = {
        TransactionType: 'LoanBrokerCoverDeposit',
        Account: vaultOwner.address,
        LoanBrokerID: loanBrokerId,
        Amount: { mpt_issuance_id: mptIssuanceId, value: coverAmount },
      }
      const coverResponse = await client.submitAndWait(coverTx, { autofill: true, wallet: vaultOwner })
      const coverResult = assertTxnSuccess(toTxnResult(`Deposited ${coverAmount} of first-loss cover`, coverResponse))

      return { ...inputData, loanBrokerId, txnResults: [...txnResults, brokerResult, coverResult] }
    } catch (error) {
      throw new Error(`Failed to set up the loan broker: ${errorMessage(error)}`)
    }
  },
})

/** Step 7: saves the wallets (with seeds), the IDs, the vault dates and the transaction hashes to a record file. */
const recordResults = createStep({
  id: 'record-results',
  description:
    'Saves the wallets, MPT, vault and loan broker IDs, vault dates and transaction results to a record file',
  inputSchema: vaultSchema,
  outputSchema: lendingSetupResultSchema,
  execute: async ({ inputData }) => {
    const { issuer, vaultOwner, depositor, borrower, network, mptIssuanceId, vaultId, loanBrokerId } = inputData
    const { subscriptionDate, redemptionDate, txnResults } = inputData

    try {
      if (!loanBrokerId) {
        throw new Error('LoanBroker ID missing')
      }

      const { record, path } = await saveFlowRecord({
        flow: 'lending-setup',
        network,
        data: {
          mptIssuanceId,
          vaultId,
          loanBrokerId,
          subscriptionDate: rippleTimeToISOTime(subscriptionDate),
          redemptionDate: rippleTimeToISOTime(redemptionDate),
          issuer: toWalletRecord(issuer),
          vaultOwner: toWalletRecord(vaultOwner),
          depositor: toWalletRecord(depositor),
          borrower: toWalletRecord(borrower),
          txnResults,
        },
      })

      return { ...inputData, loanBrokerId, recordId: record.id, recordPath: path }
    } catch (error) {
      throw new Error(`Failed to save the record: ${errorMessage(error)}`)
    }
  },
})

/**
 * Sets up the XRPL Lending Protocol up to the point where a loan can be created:
 * create wallets -> create MPT (or reuse one) -> distribute MPT -> closed-ended vault -> deposit -> loan broker + cover -> record.
 * The loan itself (LoanSet, LoanPay, LoanManage...) is left to the agent, since it depends on wall-clock time.
 */
const lendingSetupWorkflow = createWorkflow({
  id: 'lending-setup-workflow',
  description: `Sets up the XRPL Lending Protocol (XLS-66) on devnet, up to the point where a loan can be created: funds a vault owner (also the loan broker owner), a depositor and a borrower, creates a transferable MPT (default) or reuses an existing one given its issuer seed (ask the user which), sends mintAmount of it to each wallet, creates a closed-ended vault (SubscriptionDate and RedemptionDate counted from ledger time), deposits depositAmount, creates a LoanBroker and deposits coverAmount of first-loss capital, then saves a record (wallet addresses and seeds, MPTokenIssuanceID, VaultID, LoanBrokerID, vault dates, tx hashes) retrievable with the get-flow-records tool. Loans can be created with sign-loan-set only after SubscriptionDate and must end at least 60 s before RedemptionDate.
Supported networks: wss://s.devnet.rippletest.net:51233/, wss://clio.devnet.rippletest.net:51233/.`,
  inputSchema: lendingSetupWorkflowSchema,
  outputSchema: lendingSetupResultSchema,
})
  .then(createWallets)
  .then(createIssuance)
  .then(distributeTokens)
  .then(createVault)
  .then(depositIntoVault)
  .then(createLoanBroker)
  .then(recordResults)

lendingSetupWorkflow.commit()

export { lendingSetupWorkflow }
