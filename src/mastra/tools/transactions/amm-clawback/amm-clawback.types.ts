import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplAssetSchema, xrplCurrencyAmountSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * AMMClawback-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/ammclawback#ammclawback-fields
 */
export const xrplAmmClawbackFieldsSchema = z.object({
  // Required fields
  Holder: xrplAddressSchema.describe(
    "The account holding the issuer's tokens in the AMM pool, from which assets are clawed back (r-address)",
  ),
  Asset: z
    .object({
      currency: z.string().describe('Currency code of the token to claw back (converted to 160-bit hex automatically)'),
      issuer: xrplAddressSchema.describe('Must be the sender (Account) of this transaction: the token issuer'),
    })
    .describe(
      'The token to claw back, {currency, issuer}. The issuer must be the sender of this transaction and must have clawback enabled. Cannot be XRP',
    ),
  Asset2: xrplAssetSchema.describe(
    'The other asset in the AMM pool: XRP ({currency: "XRP"}), a token ({currency, issuer}) or an MPT ({mpt_issuance_id})',
  ),

  // Optional fields
  Amount: xrplCurrencyAmountSchema
    .optional()
    .describe(
      "The maximum amount of Asset to claw back from Holder, {currency, issuer, value}. currency and issuer must match Asset. If omitted, all of the Holder's share is clawed back. If the Holder has less than this, only what they have is clawed back",
    ),
  Flags: z
    .number()
    .optional()
    .describe(
      'Bit-flags. 1 (tfClawTwoAssets): also claw back an equal value of Asset2 from the AMM; only valid when both assets are issued by the sender. If unset, only Asset is clawed back and the Holder keeps the Asset2 share',
    ),
})

/**
 * Complete AMMClawback transaction schema
 */
export const xrplAmmClawbackSchema = xrplCommonFieldsSchema
  .merge(xrplAmmClawbackFieldsSchema)
  .extend({ TransactionType: z.literal('AMMClawback') })

export type XrplAmmClawbackFields = z.infer<typeof xrplAmmClawbackFieldsSchema>
export type XrplAmmClawback = z.infer<typeof xrplAmmClawbackSchema>
