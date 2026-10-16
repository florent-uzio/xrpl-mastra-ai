import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCurrencyAmountSchema, xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * VaultClawback-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/vaultclawback#vaultclawback-fields
 */
export const xrplVaultClawbackFieldsSchema = z.object({
  // Required fields
  VaultID: xrplHash256Schema.describe('ID of the vault to claw back from.'),
  Holder: xrplAddressSchema.describe('Account holding the shares to claw back from.'),

  // Optional field
  Amount: z
    .union([
      xrplCurrencyAmountSchema,
      z.object({
        mpt_issuance_id: z.string().describe('MPT issuance ID (48 hex characters)'),
        value: z.string().describe('Quoted integer amount'),
      }),
    ])
    .optional()
    .describe(
      'Amount of the vault asset to claw back. A value of 0 claws back everything the holder has. XRP is not allowed. If omitted, the vault owner targets shares and any other account targets assets.',
    ),
})

/**
 * Complete VaultClawback transaction schema
 */
export const xrplVaultClawbackSchema = xrplCommonFieldsSchema
  .merge(xrplVaultClawbackFieldsSchema)
  .extend({ TransactionType: z.literal('VaultClawback') })

export type XrplVaultClawbackFields = z.infer<typeof xrplVaultClawbackFieldsSchema>
export type XrplVaultClawback = z.infer<typeof xrplVaultClawbackSchema>
