import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * AccountSet flags that can be enabled or disabled for an account
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/accountset#accountset-flags
 */
export const AccountSetFlagsSchema = z.enum([
  'asfRequireDest', // 1 - Require a destination tag to send transactions to this account
  'asfRequireAuth', // 2 - Require authorization for users to hold balances issued by this address
  'asfDisallowXRP', // 3 - XRP should not be sent to this account (advisory only)
  'asfDisableMaster', // 4 - Disable the master key pair
  'asfAccountTxnID', // 5 - Track the ID of this account's most recent transaction
  'asfNoFreeze', // 6 - Permanently give up the ability to freeze individual trust lines
  'asfGlobalFreeze', // 7 - Freeze all assets issued by this account
  'asfDefaultRipple', // 8 - Enable rippling on this account's trust lines by default
  'asfDepositAuth', // 9 - Require authorization for users to hold balances issued by this address
  'asfAuthorizedNFTokenMinter', // 10 - Allow another account to mint NFTokens for you
  'asfDisallowIncomingNFTokenOffer', // 12 - Block incoming NFTokenOffers
  'asfDisallowIncomingCheck', // 13 - Block incoming Check objects
  'asfDisallowIncomingPayChan', // 14 - Block incoming Payment Channels
  'asfDisallowIncomingTrustline', // 15 - Block incoming trust lines
  'asfAllowTrustLineClawback', // 16 - Allow clawback of issued tokens
  'asfAllowTrustLineLocking', // 17 - Allow locking of trust lines
])

export type AccountSetFlags = z.infer<typeof AccountSetFlagsSchema>

/**
 * AccountSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/accountset#accountset-fields
 */
export const xrplAccountSetFieldsSchema = z.object({
  // AccountSet Flags
  SetFlag: z
    .number()
    .optional()
    .describe('Integer flag to enable for this account. Use AccountSetFlagsSchema for named flags'),
  ClearFlag: z
    .number()
    .optional()
    .describe('Unique identifier of a flag to disable for this account. Use AccountSetFlagsSchema for named flags'),

  // Domain and Identification
  Domain: z
    .string()
    .optional()
    .describe(
      'The domain that owns this account, as a hex string of lowercase ASCII. Max 256 bytes. Example: "6578616D706C652E636F6D" for "example.com"',
    ),
  EmailHash: z
    .string()
    .optional()
    .describe('128-bit value, conventionally the MD5 hash of an email address for Gravatar display'),
  MessageKey: z
    .string()
    .optional()
    .describe(
      'Public key for sending encrypted messages. Must be exactly 33 bytes: 0x02/0x03 for secp256k1, 0xED for Ed25519. Empty to remove',
    ),

  // NFToken Management
  NFTokenMinter: z
    .string()
    .optional()
    .describe('Another account that can mint NFTokens for you. Use ClearFlag: 10 to remove'),

  // Transfer Rate and Trading
  TransferRate: z
    .union([z.literal(0), z.number().int().gte(1000000000).lte(2000000000)])
    .optional()
    .describe(
      "Fee to charge when users transfer this account's tokens, as billionths of a unit. Range: 1000000000-2000000000, or 0 for no fee",
    ),
  TickSize: z
    .union([z.literal(0), z.number().int().gte(3).lte(15)])
    .optional()
    .describe('Tick size for offers involving currencies issued by this address. Valid: 3-15, or 0 to disable'),

  // Miscellaneous
  WalletLocator: z.string().optional().describe('Arbitrary 256-bit value with no inherent meaning'),
  WalletSize: z.number().optional().describe('Not used - valid field but does nothing'),
})

/**
 * Complete AccountSet transaction schema
 */
export const xrplAccountSetSchema = xrplCommonFieldsSchema
  .merge(xrplAccountSetFieldsSchema)
  .extend({ TransactionType: z.literal('AccountSet') })

export type XrplAccountSetFields = z.infer<typeof xrplAccountSetFieldsSchema>
export type XrplAccountSet = z.infer<typeof xrplAccountSetSchema>

/**
 * Helper function to convert AccountSet flag names to numeric values
 */
export const getAccountSetFlagValue = (flagName: AccountSetFlags): number => {
  const flagValues: Record<AccountSetFlags, number> = {
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
  }
  return flagValues[flagName]
}
