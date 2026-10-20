import { z } from 'zod'
import { xrplAssetSchema, xrplCurrencyAmountSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

const xrplAmmAmountSchema = z.union([
  z.string().describe('XRP amount in drops, e.g. "1000000" = 1 XRP'),
  xrplCurrencyAmountSchema,
])

/**
 * AMMWithdraw-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/ammwithdraw#ammwithdraw-fields
 */
export const xrplAmmWithdrawFieldsSchema = z.object({
  // Required fields
  Asset: xrplAssetSchema.describe(
    'The definition for one of the assets in the AMM pool: XRP ({currency: "XRP"}), a token ({currency, issuer}) or an MPT ({mpt_issuance_id})',
  ),
  Asset2: xrplAssetSchema.describe('The definition for the other asset in the AMM pool. Must differ from Asset'),

  // Optional fields (which combination is valid depends on the flag)
  Amount: xrplAmmAmountSchema
    .optional()
    .describe(
      'The amount of one asset to withdraw (XRP in drops as a string, or {currency, issuer, value}). Must match Asset or Asset2. Used with tfSingleAsset, tfTwoAsset, tfOneAssetLPToken, tfLimitLPToken, and optionally with tfOneAssetWithdrawAll (asset to receive)',
    ),
  Amount2: xrplAmmAmountSchema
    .optional()
    .describe(
      'The amount of the other asset to withdraw (XRP in drops as a string, or {currency, issuer, value}). Must be the pool asset that Amount is not. Used with tfTwoAsset',
    ),
  EPrice: xrplAmmAmountSchema
    .optional()
    .describe(
      'The minimum effective price, in units of the Amount asset, to receive per LP token returned. Used with tfLimitLPToken (together with Amount)',
    ),
  LPTokenIn: xrplCurrencyAmountSchema
    .optional()
    .describe(
      "How many of the AMM's LP tokens to redeem, {currency, issuer, value}. currency and issuer are the AMM's LP token (from amm_info lp_token). Used with tfLPToken and tfOneAssetLPToken",
    ),
  Flags: z
    .number()
    .optional()
    .describe(
      'Exactly one withdraw mode flag is required: 65536 (tfLPToken): LPTokenIn only (proportional withdrawal of both assets). 131072 (tfWithdrawAll): no other fields (redeem all LP tokens for both assets). 262144 (tfOneAssetWithdrawAll): Amount (the asset to receive; redeem all LP tokens for it). 524288 (tfSingleAsset): Amount only. 1048576 (tfTwoAsset): Amount and Amount2. 2097152 (tfOneAssetLPToken): Amount and LPTokenIn. 4194304 (tfLimitLPToken): Amount and EPrice',
    ),
})

/**
 * Complete AMMWithdraw transaction schema
 */
export const xrplAmmWithdrawSchema = xrplCommonFieldsSchema
  .merge(xrplAmmWithdrawFieldsSchema)
  .extend({ TransactionType: z.literal('AMMWithdraw') })

export type XrplAmmWithdrawFields = z.infer<typeof xrplAmmWithdrawFieldsSchema>
export type XrplAmmWithdraw = z.infer<typeof xrplAmmWithdrawSchema>
