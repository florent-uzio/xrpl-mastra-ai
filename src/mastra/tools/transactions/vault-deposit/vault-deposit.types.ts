import { z } from 'zod'
import { xrplAssetAmountSchema, xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * VaultDeposit-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/vaultdeposit#vaultdeposit-fields
 */
export const xrplVaultDepositFieldsSchema = z.object({
  // Required fields
  VaultID: xrplHash256Schema.describe('ID of the vault receiving the deposit.'),
  Amount: xrplAssetAmountSchema.describe("Amount to deposit. Must be the vault's asset."),
})

/**
 * Complete VaultDeposit transaction schema
 */
export const xrplVaultDepositSchema = xrplCommonFieldsSchema
  .merge(xrplVaultDepositFieldsSchema)
  .extend({ TransactionType: z.literal('VaultDeposit') })

export type XrplVaultDepositFields = z.infer<typeof xrplVaultDepositFieldsSchema>
export type XrplVaultDeposit = z.infer<typeof xrplVaultDepositSchema>
