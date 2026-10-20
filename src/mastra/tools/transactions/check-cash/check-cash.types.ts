import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplAssetAmountSchema } from '../shared/asset'
import { xrplHash256Schema } from '../shared/transaction-fields'

/**
 * CheckCash-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/checkcash#checkcash-fields
 */
export const xrplCheckCashFieldsSchema = z.object({
  CheckID: xrplHash256Schema.describe(
    "The ID of the Check ledger entry to cash, as a 64-character hex string. Only the Check's Destination can cash it.",
  ),
  Amount: xrplAssetAmountSchema
    .optional()
    .describe(
      "Redeem the Check for exactly this amount, if possible. Must be in the same currency (and issuer) as the Check's SendMax and no greater than SendMax. XRP in drops (string) or a token amount. Exactly one of Amount or DeliverMin must be provided, not both.",
    ),
  DeliverMin: xrplAssetAmountSchema
    .optional()
    .describe(
      "Redeem the Check for at least this amount and for as much as possible (up to SendMax). The transaction fails if less than this amount can be delivered. Same currency as the Check's SendMax. Exactly one of Amount or DeliverMin must be provided, not both.",
    ),
})

/**
 * Complete CheckCash transaction schema
 */
export const xrplCheckCashSchema = xrplCommonFieldsSchema
  .merge(xrplCheckCashFieldsSchema)
  .extend({ TransactionType: z.literal('CheckCash') })

export type XrplCheckCashFields = z.infer<typeof xrplCheckCashFieldsSchema>
export type XrplCheckCash = z.infer<typeof xrplCheckCashSchema>
