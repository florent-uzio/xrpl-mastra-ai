import { z } from 'zod'
import { xrplDecimalValueSchema } from '../../../../helpers'
import { xrplHash256Schema, xrplHexBlobSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * VaultSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/vaultset#vaultset-fields
 */
export const xrplVaultSetFieldsSchema = z.object({
  // Required field
  VaultID: xrplHash256Schema.describe('ID of the vault to update.'),

  // Optional fields
  Data: xrplHexBlobSchema(256).optional().describe('Hex-encoded vault metadata, up to 256 bytes.'),
  AssetsMaximum: xrplDecimalValueSchema
    .optional()
    .describe(
      'New maximum amount of the asset the vault can hold. Cannot be below the current AssetsTotal, unless 0 (no limit).',
    ),
  DomainID: xrplHash256Schema
    .optional()
    .describe('PermissionedDomain ID. Only valid on a private vault. Requires the PermissionedDomains amendment.'),
})

/**
 * Complete VaultSet transaction schema
 */
export const xrplVaultSetSchema = xrplCommonFieldsSchema
  .merge(xrplVaultSetFieldsSchema)
  .extend({ TransactionType: z.literal('VaultSet') })

export type XrplVaultSetFields = z.infer<typeof xrplVaultSetFieldsSchema>
export type XrplVaultSet = z.infer<typeof xrplVaultSetSchema>
