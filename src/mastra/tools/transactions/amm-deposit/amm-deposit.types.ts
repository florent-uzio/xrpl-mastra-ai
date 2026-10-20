import { z } from 'zod'
import { xrplAssetSchema, xrplCurrencyAmountSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

const xrplAmmAmountSchema = z.union([
  z.string().describe('XRP amount in drops, e.g. "1000000" = 1 XRP'),
  xrplCurrencyAmountSchema,
])

/**
 * AMMDeposit-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/ammdeposit#ammdeposit-fields
 */
export const xrplAmmDepositFieldsSchema = z.object({
  // Required fields
  Asset: xrplAssetSchema.describe(
    'The definition for one of the assets in the AMM pool: XRP ({currency: "XRP"}), a token ({currency, issuer}) or an MPT ({mpt_issuance_id})',
  ),
  Asset2: xrplAssetSchema.describe('The definition for the other asset in the AMM pool. Must differ from Asset'),

  // Optional fields (which combination is valid depends on the flag)
  Amount: xrplAmmAmountSchema
    .optional()
    .describe(
      'The amount of one asset to deposit (XRP in drops as a string, or {currency, issuer, value}). Must match Asset or Asset2. Used with tfSingleAsset, tfTwoAsset, tfTwoAssetIfEmpty and tfOneAssetLPToken',
    ),
  Amount2: xrplAmmAmountSchema
    .optional()
    .describe(
      'The amount of the other asset to deposit (XRP in drops as a string, or {currency, issuer, value}). Must be the pool asset that Amount is not. Used with tfTwoAsset and tfTwoAssetIfEmpty',
    ),
  EPrice: xrplAmmAmountSchema
    .optional()
    .describe(
      'The maximum effective price, in units of the Amount asset, to pay per LP token received. Used with tfLimitLPToken (together with Amount)',
    ),
  LPTokenOut: xrplCurrencyAmountSchema
    .optional()
    .describe(
      "How many of the AMM's LP tokens to receive, {currency, issuer, value}. currency and issuer are the AMM's LP token (from amm_info lp_token). Used with tfLPToken and tfOneAssetLPToken",
    ),
  Flags: z
    .number()
    .optional()
    .describe(
      'Exactly one deposit mode flag is required: 65536 (tfLPToken): Amount/Amount2 not set, LPTokenOut set (proportional deposit of both assets). 524288 (tfSingleAsset): Amount only. 1048576 (tfTwoAsset): Amount and Amount2. 2097152 (tfOneAssetLPToken): Amount and LPTokenOut. 4194304 (tfLimitLPToken): Amount and EPrice. 8388608 (tfTwoAssetIfEmpty): Amount and Amount2, only for an empty AMM',
    ),
  TradingFee: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .optional()
    .describe(
      'Only for tfTwoAssetIfEmpty (depositing into an empty AMM): the trading fee to set, in units of 1/100,000 (1000 = 1%)',
    ),
})

/**
 * Complete AMMDeposit transaction schema
 */
export const xrplAmmDepositSchema = xrplCommonFieldsSchema
  .merge(xrplAmmDepositFieldsSchema)
  .extend({ TransactionType: z.literal('AMMDeposit') })

export type XrplAmmDepositFields = z.infer<typeof xrplAmmDepositFieldsSchema>
export type XrplAmmDeposit = z.infer<typeof xrplAmmDepositSchema>
