import { z } from 'zod'
import { xrplAssetSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * AMMDelete-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/ammdelete#ammdelete-fields
 */
export const xrplAmmDeleteFieldsSchema = z.object({
  // Required fields
  Asset: xrplAssetSchema.describe(
    'The definition for one of the assets in the AMM pool: XRP ({currency: "XRP"}), a token ({currency, issuer}) or an MPT ({mpt_issuance_id})',
  ),
  Asset2: xrplAssetSchema.describe('The definition for the other asset in the AMM pool. Must differ from Asset'),
})

/**
 * Complete AMMDelete transaction schema
 */
export const xrplAmmDeleteSchema = xrplCommonFieldsSchema
  .merge(xrplAmmDeleteFieldsSchema)
  .extend({ TransactionType: z.literal('AMMDelete') })

export type XrplAmmDeleteFields = z.infer<typeof xrplAmmDeleteFieldsSchema>
export type XrplAmmDelete = z.infer<typeof xrplAmmDeleteSchema>
