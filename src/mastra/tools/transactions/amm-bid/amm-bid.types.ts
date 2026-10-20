import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplAssetSchema, xrplCurrencyAmountSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * AMMBid-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/ammbid#ammbid-fields
 */
export const xrplAmmBidFieldsSchema = z.object({
  // Required fields
  Asset: xrplAssetSchema.describe(
    'The definition for one of the assets in the AMM pool: XRP ({currency: "XRP"}), a token ({currency, issuer}) or an MPT ({mpt_issuance_id})',
  ),
  Asset2: xrplAssetSchema.describe('The definition for the other asset in the AMM pool. Must differ from Asset'),

  // Optional fields
  BidMin: xrplCurrencyAmountSchema
    .optional()
    .describe(
      "Pay at least this amount of the AMM's LP Tokens for the slot. Must be an LP token amount: currency is the AMM's 40-hex LP token currency code, issuer is the AMM account (both from the amm_info lp_token field). If the slot costs less than this, the transaction fails",
    ),
  BidMax: xrplCurrencyAmountSchema
    .optional()
    .describe(
      "Pay at most this amount of the AMM's LP Tokens for the slot. Must be an LP token amount (same currency and issuer as BidMin). If the slot costs more than this, the transaction fails",
    ),
  AuthAccounts: z
    .array(
      z.object({ AuthAccount: z.object({ Account: xrplAddressSchema.describe('Address of an authorized account') }) }),
    )
    .max(4)
    .optional()
    .describe(
      'Up to 4 additional accounts that can trade against this AMM at the discounted fee. Each entry is {AuthAccount: {Account}}. Cannot include the sender or duplicates',
    ),
})

/**
 * Complete AMMBid transaction schema
 */
export const xrplAmmBidSchema = xrplCommonFieldsSchema
  .merge(xrplAmmBidFieldsSchema)
  .extend({ TransactionType: z.literal('AMMBid') })

export type XrplAmmBidFields = z.infer<typeof xrplAmmBidFieldsSchema>
export type XrplAmmBid = z.infer<typeof xrplAmmBidSchema>
