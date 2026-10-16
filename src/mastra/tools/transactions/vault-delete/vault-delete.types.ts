import { z } from 'zod'
import { xrplHash256Schema, xrplHexBlobSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * VaultDelete-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/vaultdelete#vaultdelete-fields
 */
export const xrplVaultDeleteFieldsSchema = z.object({
  // Required field
  VaultID: xrplHash256Schema.describe('ID of the vault to delete.'),

  // Optional field
  MemoData: xrplHexBlobSchema(256)
    .optional()
    .describe(
      'Hex-encoded note recording why the vault was deleted, up to 256 bytes. Requires the LendingProtocolV1_1 amendment.',
    ),
})

/**
 * Complete VaultDelete transaction schema
 */
export const xrplVaultDeleteSchema = xrplCommonFieldsSchema
  .merge(xrplVaultDeleteFieldsSchema)
  .extend({ TransactionType: z.literal('VaultDelete') })

export type XrplVaultDeleteFields = z.infer<typeof xrplVaultDeleteFieldsSchema>
export type XrplVaultDelete = z.infer<typeof xrplVaultDeleteSchema>
