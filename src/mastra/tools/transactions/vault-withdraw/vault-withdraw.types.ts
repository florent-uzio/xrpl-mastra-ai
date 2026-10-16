import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplAssetAmountSchema, xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * VaultWithdraw-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/vaultwithdraw#vaultwithdraw-fields
 */
export const xrplVaultWithdrawFieldsSchema = z.object({
  // Required fields
  VaultID: xrplHash256Schema.describe('ID of the vault to withdraw from.'),
  Amount: xrplAssetAmountSchema.describe(
    "Either the exact amount of the vault's asset to receive, or an amount of vault shares ({mpt_issuance_id, value} of the share MPT) to redeem.",
  ),

  // Optional fields
  Destination: xrplAddressSchema.optional().describe('Account that receives the assets. Defaults to the sender.'),
  DestinationTag: z.number().int().gte(0).optional().describe('Tag identifying the reason for the withdrawal.'),
  CredentialIDs: z
    .array(xrplHash256Schema)
    .optional()
    .describe('Credential IDs authorizing the withdrawal when credential-based deposit authorization applies.'),
})

/**
 * Complete VaultWithdraw transaction schema
 */
export const xrplVaultWithdrawSchema = xrplCommonFieldsSchema
  .merge(xrplVaultWithdrawFieldsSchema)
  .extend({ TransactionType: z.literal('VaultWithdraw') })

export type XrplVaultWithdrawFields = z.infer<typeof xrplVaultWithdrawFieldsSchema>
export type XrplVaultWithdraw = z.infer<typeof xrplVaultWithdrawSchema>
