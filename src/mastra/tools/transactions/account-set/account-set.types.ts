import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * AccountSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/accountset#accountset-fields
 */
export const xrplAccountSetFieldsSchema = z.object({
  // AccountSet Flags
  SetFlag: z
    .number()
    .int()
    .min(1)
    .max(17)
    .optional()
    .describe('asf* number of the flag to enable (see the tool description)'),
  ClearFlag: z
    .number()
    .int()
    .min(1)
    .max(17)
    .optional()
    .describe('asf* number of the flag to disable (see the tool description)'),

  // Domain and Identification
  Domain: z
    .string()
    .optional()
    .describe(
      'The domain that owns this account, as plain lowercase text (hex-encoded automatically). Max 256 bytes. Example: "example.com". Empty string ("") clears the domain',
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
  NFTokenMinter: xrplAddressSchema
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
