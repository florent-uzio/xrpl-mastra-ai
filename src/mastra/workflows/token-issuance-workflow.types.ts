import { Wallet } from 'xrpl'
import z from 'zod'

export const AccountSetAsfFlagsMap = {
  asfRequireDest: 1,
  asfRequireAuth: 2,
  asfDisallowXRP: 3,
  asfDisableMaster: 4,
  asfAccountTxnID: 5,
  asfNoFreeze: 6,
  asfGlobalFreeze: 7,
  asfDefaultRipple: 8,
  asfDepositAuth: 9,
  asfAuthorizedNFTokenMinter: 10,
  asfDisallowIncomingNFTokenOffer: 12,
  asfDisallowIncomingCheck: 13,
  asfDisallowIncomingPayChan: 14,
  asfDisallowIncomingTrustline: 15,
  asfAllowTrustLineClawback: 16,
  asfAllowTrustLineLocking: 17,
} as const

export const tokenIssuanceWorkflowNetworkSchema = z.enum([
  'wss://s.altnet.rippletest.net:51233/',
  'wss://testnet.xrpl-labs.com/',
  // devnet
  'wss://clio.devnet.rippletest.net:51233/',
  'wss://s.devnet.rippletest.net:51233/',
])

const issuerSchema = z.custom<Wallet>().describe('Issuer wallet')

const trustlineSchema = z.object({
  currency: z.string().describe('Currency code for the token (e.g., "USD", "TOKEN")'),
  trustlineLimit: z.string().describe('Trust line limit value for each holder'),
})

const issuerSettingsSchema = z.object({
  domain: z.string().optional().describe('Issuer Domain'),
  flags: z
    .array(z.enum(Object.keys(AccountSetAsfFlagsMap) as [string, ...string[]]))
    .optional()
    .describe('Flags to set for the issuer account'),
})

// Input schema for the workflow
export const tokenIssuanceWorkflowSchema = z.object({
  network: tokenIssuanceWorkflowNetworkSchema.describe('Network to use for the workflow'),
  trustline: trustlineSchema.describe('Trust line settings for the token'),
  issuerSettings: issuerSettingsSchema.describe('Settings for the issuer account'),
  holders: z.number().describe('Number of holders to create'),
  mintAmount: z.string().describe('Amount of tokens to mint for each holder'),
})

// Additional schema for issuer and holders
const issuerAndHoldersSchema = z.object({
  issuer: issuerSchema,
  holders: z.array(z.custom<Wallet>().describe('Holder wallet')),
})

const txnResultSchema = z.object({
  description: z.string().describe('Transaction description'),
  hash: z.string().describe('Transaction hash'),
  status: z.string().describe('Transaction status'),
})
export type TxnResult = z.infer<typeof txnResultSchema>

// Main schema for the workflow steps
export const walletsSchema = tokenIssuanceWorkflowSchema.merge(issuerAndHoldersSchema)

export const settingsSchema = walletsSchema.merge(z.object({ txnResults: z.array(txnResultSchema) }))
