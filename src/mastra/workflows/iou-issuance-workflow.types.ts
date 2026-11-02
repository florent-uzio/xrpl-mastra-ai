import { AccountSetAsfFlags } from 'xrpl'
import z from 'zod'
import { workflowNetworkSchema } from '../../helpers'
import { addressSchema, resultShape, txnResultSchema, walletRecordSchema } from './shared'

/**
 * Flag names (e.g. "asfDefaultRipple") from xrpl's AccountSetAsfFlags enum.
 * Numeric enums also contain reverse mappings (8 -> name), so numeric keys are filtered out.
 *
 * @see https://xrpl.org/docs/references/protocol/transactions/types/accountset#accountset-flags
 */
const accountSetAsfFlagNames = Object.keys(AccountSetAsfFlags).filter(k => isNaN(Number(k))) as [
  keyof typeof AccountSetAsfFlags,
  ...(keyof typeof AccountSetAsfFlags)[],
]

/**
 * Schema for XRPL wallet objects
 */
const issuerSchema = walletRecordSchema.describe('Issuer wallet')

/**
 * Trust line configuration for IOU issuance
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
  flags: z.array(z.enum(accountSetAsfFlagNames)).optional().describe('Account flags to set for the issuer account'),
})

/**
 * Main workflow input schema
 *
 * Defines all the parameters required to execute the IOU issuance workflow.
 * This is what users provide when calling the workflow.
 */
export const iouIssuanceWorkflowSchema = z.object({
  network: workflowNetworkSchema(['testnet', 'devnet'], 'Network to use for the workflow'),
  trustline: trustlineSchema.describe('Trust line settings for the token'),
  issuerSettings: issuerSettingsSchema.describe('Settings for the issuer account'),
  holders: z.number().int().positive().describe('Number of holder wallets to create'),
  mintAmount: z.string().describe('Amount of tokens to mint for each holder'),
})

/**
 * Schema for wallet objects (issuer and holders)
 */
const issuerAndHoldersSchema = z.object({
  issuer: issuerSchema,
  holders: z.array(walletRecordSchema.describe('Holder wallet')),
})

/**
 * Schema for workflow step that creates wallets
 *
 * Extends the main workflow schema with issuer and holders information
 * that gets populated during wallet creation.
 */
export const walletsSchema = iouIssuanceWorkflowSchema.extend(issuerAndHoldersSchema.shape)

/**
 * Schema for workflow steps that perform transactions
 *
 * Extends the wallets schema with transaction results array
 * that gets populated as transactions are executed.
 */
export const settingsSchema = walletsSchema.extend({
  txnResults: z.array(txnResultSchema).describe('Array of transaction results from this step'),
})

/** Workflow output: what was issued and to whom, without seeds */
export const iouIssuanceResultSchema = z.object({
  ...resultShape,
  currency: z.string().describe('Currency code, as sent to the ledger (hex for codes longer than 3 characters)'),
  issuer: addressSchema,
  holders: z.array(addressSchema),
})
