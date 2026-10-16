import { createStep, createWorkflow } from '@mastra/core/workflows'
import {
  Client,
  deriveConfidentialKeypair,
  fetchMPToken,
  fetchMPTokenIssuance,
  getConfidentialBalance,
  MPTokenAuthorize,
  MPTokenIssuanceCreate,
  MPTokenIssuanceCreateFlags,
  MPTokenIssuanceSet,
  Payment,
  prepareConfidentialConvert,
  prepareConfidentialConvertBack,
  prepareConfidentialMergeInbox,
  prepareConfidentialSend,
  SubmittableTransaction,
  Wallet,
} from 'xrpl'
import type { ECDSA } from 'xrpl'
import { getXrplClient, saveFlowRecord, toWalletRecord } from '../../helpers'
import {
  confidentialMptResultSchema,
  confidentialMptWorkflowSchema,
  confidentialStateSchema,
} from './confidential-mpt-workflow.types'
import { assertTxnSuccess, errorMessage, toTxnResult, TxnResult } from './shared'

/** Ledger flags equal the creation flags (e.g. lsfMPTRequireAuth = tfMPTRequireAuth). lsfMPTAuthorized: set on an MPToken once the issuer authorized the holder. Not exported by xrpl.js. */
const MPTOKEN_AUTHORIZED = 0x2

type MPToken = Awaited<ReturnType<typeof fetchMPToken>>

type Account = typeof confidentialMptWorkflowSchema._output.issuer

/** The seed the account was given, or a new one. */
const confidentialSeedOf = (account: Account) =>
  (account.source === 'seed' && account.confidentialSeed) || newConfidentialSeed()

type State = typeof confidentialStateSchema._output

/**
 * The confidential keypair is derived from a seed, so the seed is all that has to be kept.
 * ECDSA is a type-only import: Node's ESM loader cannot see xrpl's enum export.
 */
const newConfidentialSeed = () => Wallet.generate('ecdsa-secp256k1' as ECDSA).seed!

/** A holder and its confidential seed. */
const accountsOf = (state: State) => {
  const { holderWallet, destinationWallet, confidentialSeeds } = state
  return [
    { label: 'holder', wallet: holderWallet, confidentialSeed: confidentialSeeds.holder },
    ...(destinationWallet
      ? [{ label: 'destination', wallet: destinationWallet, confidentialSeed: confidentialSeeds.destination! }]
      : []),
  ]
}

/** The MPToken of `account`, or undefined when the account has not opted in. */
const findMPToken = async (client: Client, account: string, mptIssuanceId: string): Promise<MPToken | undefined> => {
  try {
    return await fetchMPToken(client, account, mptIssuanceId)
  } catch (error) {
    if ((error as { data?: { error?: string } }).data?.error === 'entryNotFound') return undefined
    throw error
  }
}

const submit = async (client: Client, tx: SubmittableTransaction, wallet: Wallet, description: string) =>
  assertTxnSuccess(toTxnResult(description, await client.submitAndWait(tx, { autofill: true, wallet })))

/** Step 1: loads the given accounts from their seeds and creates and funds the missing ones. */
const setupWallets = createStep({
  id: 'setup-wallets',
  description: 'Loads the accounts that were given by seed and creates and funds the missing ones',
  inputSchema: confidentialMptWorkflowSchema,
  outputSchema: confidentialStateSchema.omit({ mptIssuanceId: true, txnResults: true }),
  execute: async ({ inputData, mastra }) => {
    const { network, issuer, holder, send } = inputData

    try {
      const client = await getXrplClient(network, mastra)
      const loadOrFund = async (account: Account) =>
        account.source === 'seed' ? Wallet.fromSeed(account.seed) : (await client.fundWallet()).wallet

      const [issuerWallet, holderWallet, destinationWallet] = await Promise.all([
        loadOrFund(issuer),
        loadOrFund(holder),
        send ? loadOrFund(send.destination) : undefined,
      ])

      return {
        ...inputData,
        issuerWallet,
        holderWallet,
        destinationWallet,
        confidentialSeeds: {
          holder: confidentialSeedOf(holder),
          destination: send ? confidentialSeedOf(send.destination) : undefined,
        },
      }
    } catch (error) {
      throw new Error(`Failed to set up wallets: ${errorMessage(error)}`)
    }
  },
})

/**
 * Step 2: creates the issuance when none was given, then makes sure it can hold confidential balances and that
 * the issuer (and auditor, when requested) encryption keys are registered. Those keys are needed by every
 * confidential transaction.
 */
const setupIssuance = createStep({
  id: 'setup-issuance',
  description: 'Creates the confidential-capable MPT issuance if needed and registers the issuer/auditor keys',
  inputSchema: setupWallets.outputSchema,
  outputSchema: confidentialStateSchema,
  execute: async ({ inputData, mastra }) => {
    const { issuerWallet: issuer, network, issuance: issuanceRequest, auditor, confidentialSeeds } = inputData
    const txnResults: TxnResult[] = []

    try {
      const client = await getXrplClient(network, mastra)
      let mptIssuanceId: string

      if (issuanceRequest.source === 'existing') {
        mptIssuanceId = issuanceRequest.mptIssuanceId
      } else {
        const flags = [...(issuanceRequest.flags ?? []), 'tfMPTCanTransfer', 'tfMPTCanHoldConfidentialBalance'] as const
        const tx: MPTokenIssuanceCreate = {
          TransactionType: 'MPTokenIssuanceCreate',
          Account: issuer.address,
          Flags: flags.reduce((acc, flag) => acc | MPTokenIssuanceCreateFlags[flag], 0),
        }
        const response = await client.submitAndWait(tx, { autofill: true, wallet: issuer })
        txnResults.push(assertTxnSuccess(toTxnResult('Created MPT issuance', response)))

        const created = (response.result.meta as { mpt_issuance_id?: string }).mpt_issuance_id
        if (!created) throw new Error(`MPTokenIssuanceID missing from the metadata of ${txnResults[0].hash}`)
        mptIssuanceId = created
      }

      const issuance = await fetchMPTokenIssuance(client, mptIssuanceId)
      if (issuance.Issuer !== issuer.classicAddress) {
        throw new Error(`Issuance ${mptIssuanceId} was issued by ${issuance.Issuer}, not ${issuer.classicAddress}`)
      }
      if (!(issuance.Flags & MPTokenIssuanceCreateFlags.tfMPTCanHoldConfidentialBalance)) {
        throw new Error(
          `Issuance ${mptIssuanceId} does not have tfMPTCanHoldConfidentialBalance, which cannot be added after creation`,
        )
      }

      const issuerSeed = issuance.IssuerEncryptionKey ? undefined : newConfidentialSeed()
      const auditorSeed = auditor && !issuance.AuditorEncryptionKey ? newConfidentialSeed() : undefined
      if (issuerSeed || auditorSeed) {
        const tx: MPTokenIssuanceSet = {
          TransactionType: 'MPTokenIssuanceSet',
          Account: issuer.address,
          MPTokenIssuanceID: mptIssuanceId,
          ...(issuerSeed && { IssuerEncryptionKey: deriveConfidentialKeypair(issuerSeed).publicKey }),
          ...(auditorSeed && { AuditorEncryptionKey: deriveConfidentialKeypair(auditorSeed).publicKey }),
        }
        txnResults.push(await submit(client, tx, issuer, 'Registered the issuer/auditor encryption keys'))
      }

      return {
        ...inputData,
        confidentialSeeds: { ...confidentialSeeds, issuer: issuerSeed, auditor: auditorSeed },
        mptIssuanceId,
        txnResults,
      }
    } catch (error) {
      throw new Error(`Failed to set up the issuance: ${errorMessage(error)}`)
    }
  },
})

/** Step 3: the holder (and the send destination) opt in to the MPT, unless they already did. */
const optIn = createStep({
  id: 'opt-in',
  description: 'The holder and the send destination opt in to the MPT with MPTokenAuthorize if they have not yet',
  inputSchema: confidentialStateSchema,
  outputSchema: confidentialStateSchema,
  execute: async ({ inputData, mastra }) => {
    const { network, mptIssuanceId, txnResults } = inputData

    try {
      const client = await getXrplClient(network, mastra)
      const results: TxnResult[] = []

      for (const { wallet, label } of accountsOf(inputData)) {
        if (await findMPToken(client, wallet.classicAddress, mptIssuanceId)) continue

        const tx: MPTokenAuthorize = {
          TransactionType: 'MPTokenAuthorize',
          Account: wallet.address,
          MPTokenIssuanceID: mptIssuanceId,
        }
        results.push(await submit(client, tx, wallet, `The ${label} ${wallet.address} opted in`))
      }

      return { ...inputData, txnResults: [...txnResults, ...results] }
    } catch (error) {
      throw new Error(`Failed to opt in: ${errorMessage(error)}`)
    }
  },
})

/** Step 4: the issuer authorizes the accounts that are not authorized yet. Only needed with tfMPTRequireAuth. */
const authorize = createStep({
  id: 'authorize',
  description: 'The issuer authorizes the holder and the destination. Skipped unless the issuance has tfMPTRequireAuth',
  inputSchema: confidentialStateSchema,
  outputSchema: confidentialStateSchema,
  execute: async ({ inputData, mastra }) => {
    const { issuerWallet: issuer, network, mptIssuanceId, txnResults } = inputData

    try {
      const client = await getXrplClient(network, mastra)
      const issuance = await fetchMPTokenIssuance(client, mptIssuanceId)
      if (!(issuance.Flags & MPTokenIssuanceCreateFlags.tfMPTRequireAuth)) return inputData

      const results: TxnResult[] = []
      for (const { wallet } of accountsOf(inputData)) {
        const mptoken = await fetchMPToken(client, wallet.classicAddress, mptIssuanceId)
        if (mptoken.Flags & MPTOKEN_AUTHORIZED) continue

        const tx: MPTokenAuthorize = {
          TransactionType: 'MPTokenAuthorize',
          Account: issuer.address,
          MPTokenIssuanceID: mptIssuanceId,
          Holder: wallet.address,
        }
        results.push(await submit(client, tx, issuer, `Authorized ${wallet.address}`))
      }

      return { ...inputData, txnResults: [...txnResults, ...results] }
    } catch (error) {
      throw new Error(`Failed to authorize: ${errorMessage(error)}`)
    }
  },
})

/** Step 5: the issuer pays the holder what it lacks to convert `convertAmount`. */
const mintToHolder = createStep({
  id: 'mint-to-holder',
  description: 'The issuer pays the holder the public MPT balance it lacks to convert convertAmount',
  inputSchema: confidentialStateSchema,
  outputSchema: confidentialStateSchema,
  execute: async ({ inputData, mastra }) => {
    const { issuerWallet: issuer, holderWallet, network, convertAmount, mptIssuanceId, txnResults } = inputData

    try {
      const client = await getXrplClient(network, mastra)
      const mptoken = await fetchMPToken(client, holderWallet.classicAddress, mptIssuanceId)
      const missing = BigInt(convertAmount) - BigInt(mptoken.MPTAmount ?? 0)
      if (missing <= 0n) return inputData

      const tx: Payment = {
        TransactionType: 'Payment',
        Account: issuer.address,
        Destination: holderWallet.address,
        Amount: { mpt_issuance_id: mptIssuanceId, value: missing.toString() },
      }
      const result = await submit(client, tx, issuer, `Minted ${missing} to ${holderWallet.address}`)

      return { ...inputData, txnResults: [...txnResults, result] }
    } catch (error) {
      throw new Error(`Failed to mint MPT: ${errorMessage(error)}`)
    }
  },
})

/**
 * Step 6: the holder converts `convertAmount` into its confidential balance (the inbox), registering its key the
 * first time. The destination registers its key too, with a zero conversion, so it can receive a confidential send.
 */
const convert = createStep({
  id: 'convert',
  description:
    'ConfidentialMPTConvert: the holder moves convertAmount to its confidential balance and registers its key',
  inputSchema: confidentialStateSchema,
  outputSchema: confidentialStateSchema,
  execute: async ({ inputData, mastra }) => {
    const { network, convertAmount, mptIssuanceId, txnResults } = inputData

    try {
      const client = await getXrplClient(network, mastra)
      const results: TxnResult[] = []

      for (const { label, wallet, confidentialSeed } of accountsOf(inputData)) {
        const holderKeypair = deriveConfidentialKeypair(confidentialSeed)
        const registeredKey = (await fetchMPToken(client, wallet.classicAddress, mptIssuanceId)).HolderEncryptionKey
        if (registeredKey && registeredKey !== holderKeypair.publicKey) {
          throw new Error(`The ${label} ${wallet.address} registered another encryption key: pass its confidentialSeed`)
        }
        const amount = label === 'holder' ? BigInt(convertAmount) : 0n
        if (label !== 'holder' && registeredKey) continue

        const tx = await prepareConfidentialConvert(client, {
          account: wallet.classicAddress,
          mptIssuanceID: mptIssuanceId,
          amount,
          holderKeypair,
        })
        results.push(await submit(client, tx, wallet, `The ${label} converted ${amount} to a confidential balance`))
      }

      return { ...inputData, txnResults: [...txnResults, ...results] }
    } catch (error) {
      throw new Error(`Failed to convert: ${errorMessage(error)}`)
    }
  },
})

/** Step 7: moves the holder's inbox into its spending balance, which is what sends and convert-backs spend. */
const mergeInbox = createStep({
  id: 'merge-inbox',
  description: 'ConfidentialMPTMergeInbox: the holder moves its confidential inbox to its spending balance',
  inputSchema: confidentialStateSchema,
  outputSchema: confidentialStateSchema,
  execute: async ({ inputData, mastra }) => {
    const { holderWallet, network, mptIssuanceId, txnResults } = inputData

    try {
      const client = await getXrplClient(network, mastra)
      const tx = await prepareConfidentialMergeInbox(client, {
        account: holderWallet.classicAddress,
        mptIssuanceID: mptIssuanceId,
      })
      const result = await submit(client, tx, holderWallet, 'The holder merged its confidential inbox')

      return { ...inputData, txnResults: [...txnResults, result] }
    } catch (error) {
      throw new Error(`Failed to merge the inbox: ${errorMessage(error)}`)
    }
  },
})

/** Step 8 (optional): the holder sends part of its confidential balance to the destination. */
const send = createStep({
  id: 'send',
  description:
    'ConfidentialMPTSend from the holder to the destination, which then merges its inbox. Skipped unless a send was requested',
  inputSchema: confidentialStateSchema,
  outputSchema: confidentialStateSchema,
  execute: async ({ inputData, mastra }) => {
    const { holderWallet, destinationWallet, confidentialSeeds, network, mptIssuanceId, txnResults } = inputData
    const request = inputData.send
    if (!request || !destinationWallet) return inputData

    try {
      const client = await getXrplClient(network, mastra)
      const tx = await prepareConfidentialSend(client, {
        account: holderWallet.classicAddress,
        destination: destinationWallet.classicAddress,
        mptIssuanceID: mptIssuanceId,
        amount: BigInt(request.amount),
        senderKeypair: deriveConfidentialKeypair(confidentialSeeds.holder),
      })
      const sent = await submit(
        client,
        tx,
        holderWallet,
        `The holder sent ${request.amount} confidentially to ${destinationWallet.address}`,
      )

      // The amount lands in the destination's inbox: merge it so that it is spendable
      const mergeTx = await prepareConfidentialMergeInbox(client, {
        account: destinationWallet.classicAddress,
        mptIssuanceID: mptIssuanceId,
      })
      const merged = await submit(client, mergeTx, destinationWallet, 'The destination merged its confidential inbox')

      return { ...inputData, txnResults: [...txnResults, sent, merged] }
    } catch (error) {
      throw new Error(`Failed to send confidentially: ${errorMessage(error)}`)
    }
  },
})

/** Step 9 (optional): the holder converts part of its confidential balance back to a public balance. */
const convertBack = createStep({
  id: 'convert-back',
  description: 'ConfidentialMPTConvertBack by the holder. Skipped unless a convert back was requested',
  inputSchema: confidentialStateSchema,
  outputSchema: confidentialStateSchema,
  execute: async ({ inputData, mastra }) => {
    const { holderWallet, confidentialSeeds, network, mptIssuanceId, txnResults } = inputData
    const request = inputData.convertBack
    if (!request) return inputData

    try {
      const client = await getXrplClient(network, mastra)
      const tx = await prepareConfidentialConvertBack(client, {
        account: holderWallet.classicAddress,
        mptIssuanceID: mptIssuanceId,
        amount: BigInt(request.amount),
        holderKeypair: deriveConfidentialKeypair(confidentialSeeds.holder),
      })
      const result = await submit(
        client,
        tx,
        holderWallet,
        `The holder converted ${request.amount} back to its public balance`,
      )

      return { ...inputData, txnResults: [...txnResults, result] }
    } catch (error) {
      throw new Error(`Failed to convert back: ${errorMessage(error)}`)
    }
  },
})

/**
 * Step 10: reads the balances back from the ledger (decrypting the confidential ones) and saves the wallets, the
 * confidential seeds, the MPTokenIssuanceID and the transaction hashes to a record file.
 */
const recordResults = createStep({
  id: 'record-results',
  description: 'Reads the final balances and saves the accounts, confidential seeds and transactions to a record file',
  inputSchema: confidentialStateSchema,
  outputSchema: confidentialMptResultSchema,
  execute: async ({ inputData, mastra }) => {
    const { issuerWallet: issuer, network, mptIssuanceId, confidentialSeeds, txnResults } = inputData

    try {
      const client = await getXrplClient(network, mastra)
      const balances: Record<string, { publicBalance: string; confidentialSpendingBalance: string }> = {}

      for (const { label, wallet, confidentialSeed } of accountsOf(inputData)) {
        const mptoken = await fetchMPToken(client, wallet.classicAddress, mptIssuanceId)
        const confidential = await getConfidentialBalance(
          client,
          wallet.classicAddress,
          mptIssuanceId,
          deriveConfidentialKeypair(confidentialSeed).privateKey,
        )
        balances[label] = {
          publicBalance: (mptoken.MPTAmount ?? '0').toString(),
          confidentialSpendingBalance: confidential.toString(),
        }
      }

      const { record, path } = await saveFlowRecord({
        flow: 'confidential-mpt',
        network,
        data: {
          mptIssuanceId,
          issuer: toWalletRecord(issuer),
          holder: { ...toWalletRecord(inputData.holderWallet), confidentialSeed: confidentialSeeds.holder },
          destination: inputData.destinationWallet && {
            ...toWalletRecord(inputData.destinationWallet),
            confidentialSeed: confidentialSeeds.destination,
          },
          // only the keys this run registered: an existing issuance keeps its own
          issuerConfidentialSeed: confidentialSeeds.issuer,
          auditorConfidentialSeed: confidentialSeeds.auditor,
          balances,
          txnResults,
        },
      })

      return {
        ...inputData,
        balances: balances as { holder: (typeof balances)[string]; destination?: (typeof balances)[string] },
        recordId: record.id,
        recordPath: path,
      }
    } catch (error) {
      throw new Error(`Failed to record the results: ${errorMessage(error)}`)
    }
  },
})

/**
 * Gets a confidential MPT balance into a holder account:
 * wallets -> issuance (+ issuer/auditor keys) -> opt in -> authorize (tfMPTRequireAuth only) -> mint -> convert ->
 * merge inbox -> optional confidential send -> optional convert back -> balances + record.
 */
const confidentialMptWorkflow = createWorkflow({
  id: 'confidential-mpt-workflow',
  description: `Gets a confidential MPT balance into a holder account on XRPL devnet (ConfidentialTransfer amendment): creates or reuses an MPT issuance that can hold confidential balances, registers the issuer and optional auditor encryption keys, has the holder opt in, mints public MPT to it, converts it to a confidential balance (ConfidentialMPTConvert) and merges the inbox. Optionally sends part of it confidentially to a second holder (ConfidentialMPTSend) and converts part back to public (ConfidentialMPTConvertBack). Issuer, holder and destination can each be generated and funded (source 'generate') or reused by seed (source 'seed'), and the MPT can be newly issued by the issuer (source 'create') or an existing one reused (source 'existing'); the user must pick for each of them, never assume. Seeds (find them in the records of earlier runs with the get-flow-records tool); an existing account that already registered a confidential key also needs its confidentialSeed. Saves a record with all seeds and tx hashes. ALWAYS confirm every input with the user before running: for the issuer, issuance, holder (and destination): generate/create new or use existing (seed/issuance ID); convertAmount, auditor yes/no, send yes/no (amount, destination), convertBack yes/no (amount).
Supported networks: wss://s.devnet.rippletest.net:51233/, wss://clio.devnet.rippletest.net:51233/.`,
  inputSchema: confidentialMptWorkflowSchema,
  outputSchema: confidentialMptResultSchema,
})
  .then(setupWallets)
  .then(setupIssuance)
  .then(optIn)
  .then(authorize)
  .then(mintToHolder)
  .then(convert)
  .then(mergeInbox)
  .then(send)
  .then(convertBack)
  .then(recordResults)

confidentialMptWorkflow.commit()

export { confidentialMptWorkflow }
