import { z } from 'zod'
import { xrplAssetSchema, xrplHash256Schema, xrplHexBlobSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplDecimalValueSchema } from '../../../../helpers'

/**
 * VaultCreate-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/vaultcreate#vaultcreate-fields
 */
export const xrplVaultCreateFieldsSchema = z.object({
  // Required field
  Asset: xrplAssetSchema.describe('The asset held in the vault: XRP, a trust line token or an MPT.'),

  // Optional fields
  AssetsMaximum: xrplDecimalValueSchema
    .optional()
    .describe('Maximum amount of the asset the vault can hold. Omit or 0 for no limit.'),
  Data: xrplHexBlobSchema(256).optional().describe('Hex-encoded vault metadata, up to 256 bytes.'),
  DomainID: xrplHash256Schema
    .optional()
    .describe(
      'PermissionedDomain ID restricting deposits to accounts with credentials in that domain. Only valid with tfVaultPrivate. Requires the PermissionedDomains amendment.',
    ),
  MPTokenMetadata: xrplHexBlobSchema(1024)
    .optional()
    .describe('Hex-encoded metadata of the share token, up to 1024 bytes.'),
  Scale: z
    .number()
    .int()
    .min(0)
    .max(18)
    .optional()
    .describe(
      'Share precision (decimal places) for trust line token vaults. Default 6. Must be omitted for XRP and MPT.',
    ),
  VaultKind: z
    .union([z.literal(0), z.literal(1)])
    .optional()
    .describe(
      '0 = open-ended (default), 1 = closed-ended. Cannot be changed later. Requires the LendingProtocolV1_1 amendment.',
    ),
  SubscriptionDate: z
    .number()
    .int()
    .optional()
    .describe(
      'Closed-ended only (required). When the subscription window closes, in seconds since the Ripple Epoch. Must be in the future.',
    ),
  RedemptionDate: z
    .number()
    .int()
    .optional()
    .describe(
      'Closed-ended only (required). When depositors can redeem, in seconds since the Ripple Epoch. Must be 180 seconds to under 30 years after SubscriptionDate.',
    ),
  WithdrawalPolicy: z
    .literal(1)
    .optional()
    .describe('1 = first come, first served. This is the default and the only supported policy.'),
})

/**
 * Complete VaultCreate transaction schema
 */
export const xrplVaultCreateSchema = xrplCommonFieldsSchema
  .merge(xrplVaultCreateFieldsSchema)
  .extend({ TransactionType: z.literal('VaultCreate') })

export type XrplVaultCreateFields = z.infer<typeof xrplVaultCreateFieldsSchema>
export type XrplVaultCreate = z.infer<typeof xrplVaultCreateSchema>
