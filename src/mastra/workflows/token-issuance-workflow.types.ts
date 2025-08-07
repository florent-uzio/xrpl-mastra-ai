import { Wallet } from 'xrpl'
import z from 'zod'

/**
 * AccountSetAsfFlagsMap - Maps flag names to their numeric values
 *
 * This object provides a type-safe way to reference XRPL account set flags.
 * Each flag has a specific purpose for configuring account behavior.
 *
 * @see https://xrpl.org/docs/references/protocol/transactions/types/accountset#accountset-flags
 */
export const AccountSetAsfFlagsMap = {
  /** Require a destination tag to send transactions to this account */
  asfRequireDest: 1,
  /** Require authorization for users to hold balances issued by this address */
  asfRequireAuth: 2,
  /** XRP should not be sent to this account */
  asfDisallowXRP: 3,
  /** Disallow use of the master key pair */
  asfDisableMaster: 4,
  /** Track the ID of this account's most recent transaction */
  asfAccountTxnID: 5,
  /** Permanently give up the ability to freeze individual trust lines */
  asfNoFreeze: 6,
  /** Freeze all assets issued by this account */
  asfGlobalFreeze: 7,
  /** Enable rippling on this account's trust lines by default */
  asfDefaultRipple: 8,
  /** Enable Deposit Authorization on this account */
  asfDepositAuth: 9,
  /** Allow another account to mint and burn tokens on behalf of this account */
  asfAuthorizedNFTokenMinter: 10,
  /** Disallow other accounts from creating incoming NFTOffers */
  asfDisallowIncomingNFTokenOffer: 12,
  /** Disallow other accounts from creating incoming Checks */
  asfDisallowIncomingCheck: 13,
  /** Disallow other accounts from creating incoming PayChannels */
  asfDisallowIncomingPayChan: 14,
  /** Disallow other accounts from creating incoming Trustlines */
  asfDisallowIncomingTrustline: 15,
  /** Permanently gain the ability to claw back issued IOUs */
  asfAllowTrustLineClawback: 16,
  /** Issuers allow their IOUs to be used as escrow amounts */
  asfAllowTrustLineLocking: 17,
} as const

/**
 * Supported network endpoints for the token issuance workflow
 *
 * These are the WebSocket URLs for different XRPL networks.
 * The workflow is designed primarily for testnet and devnet networks.
 */
export const tokenIssuanceWorkflowNetworkSchema = z.enum([
  // Testnet networks
  'wss://s.altnet.rippletest.net:51233/',
  'wss://testnet.xrpl-labs.com/',
  // Devnet networks
  'wss://clio.devnet.rippletest.net:51233/',
  'wss://s.devnet.rippletest.net:51233/',
])

/**
 * Schema for XRPL wallet objects
 */
const issuerSchema = z.custom<Wallet>().describe('Issuer wallet')

/**
 * Trust line configuration for token issuance
 *
 * Defines the currency and limit for trust lines that holders will create
 * to accept tokens from the issuer.
 */
const trustlineSchema = z.object({
  currency: z.string().describe('Currency code for the token (e.g., "USD", "TOKEN")'),
  trustlineLimit: z.string().describe('Trust line limit value for each holder'),
})

/**
 * Issuer account configuration settings
 *
 * Defines optional settings for the issuer account, including domain
 * and account flags that control account behavior.
 */
const issuerSettingsSchema = z.object({
  domain: z.string().optional().describe('Issuer domain for account identification'),
  flags: z
    .array(z.enum(Object.keys(AccountSetAsfFlagsMap) as [string, ...string[]]))
    .optional()
    .describe('Account flags to set for the issuer account'),
})

/**
 * Main workflow input schema
 *
 * Defines all the parameters required to execute the token issuance workflow.
 * This is what users provide when calling the workflow.
 */
export const tokenIssuanceWorkflowSchema = z.object({
  network: tokenIssuanceWorkflowNetworkSchema.describe('Network to use for the workflow'),
  trustline: trustlineSchema.describe('Trust line settings for the token'),
  issuerSettings: issuerSettingsSchema.describe('Settings for the issuer account'),
  holders: z.number().describe('Number of holder wallets to create'),
  mintAmount: z.string().describe('Amount of tokens to mint for each holder'),
})

/**
 * Schema for wallet objects (issuer and holders)
 */
const issuerAndHoldersSchema = z.object({
  issuer: issuerSchema,
  holders: z.array(z.custom<Wallet>().describe('Holder wallet')),
})

/**
 * Transaction result schema
 *
 * Represents the result of a single XRPL transaction with
 * description, hash, and status information.
 */
const txnResultSchema = z.object({
  description: z.string().describe('Human-readable description of the transaction'),
  hash: z.string().describe('Transaction hash for blockchain verification'),
  status: z.string().describe('Transaction status (success, failure, etc.)'),
})

/**
 * Type definition for transaction results
 */
export type TxnResult = z.infer<typeof txnResultSchema>

/**
 * Schema for workflow step that creates wallets
 *
 * Extends the main workflow schema with issuer and holders information
 * that gets populated during wallet creation.
 */
export const walletsSchema = tokenIssuanceWorkflowSchema.merge(issuerAndHoldersSchema)

/**
 * Schema for workflow steps that perform transactions
 *
 * Extends the wallets schema with transaction results array
 * that gets populated as transactions are executed.
 */
export const settingsSchema = walletsSchema.merge(
  z.object({
    txnResults: z.array(txnResultSchema).describe('Array of transaction results from this step'),
  }),
)
