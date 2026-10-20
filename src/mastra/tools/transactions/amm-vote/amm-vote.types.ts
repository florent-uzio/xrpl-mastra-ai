import { z } from 'zod'
import { xrplAssetSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * AMMVote-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/ammvote#ammvote-fields
 */
export const xrplAmmVoteFieldsSchema = z.object({
  // Required fields
  Asset: xrplAssetSchema.describe(
    'The definition for one of the assets in the AMM pool: XRP ({currency: "XRP"}), a token ({currency, issuer}) or an MPT ({mpt_issuance_id})',
  ),
  Asset2: xrplAssetSchema.describe('The definition for the other asset in the AMM pool. Must differ from Asset'),
  TradingFee: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .describe(
      'The proposed fee to vote for, in units of 1/100,000. A value of 1 is equivalent to 0.001%. Maximum value is 1000 (1% fee). Minimum value is 0 (no fee)',
    ),
})

/**
 * Complete AMMVote transaction schema
 */
export const xrplAmmVoteSchema = xrplCommonFieldsSchema
  .merge(xrplAmmVoteFieldsSchema)
  .extend({ TransactionType: z.literal('AMMVote') })

export type XrplAmmVoteFields = z.infer<typeof xrplAmmVoteFieldsSchema>
export type XrplAmmVote = z.infer<typeof xrplAmmVoteSchema>
