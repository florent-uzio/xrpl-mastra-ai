import { z } from 'zod'
import { xrplCurrencyAmountSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * AMMCreate-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/ammcreate#ammcreate-fields
 */
export const xrplAmmCreateFieldsSchema = z.object({
  // Required fields
  Amount: z
    .union([z.string(), xrplCurrencyAmountSchema])
    .describe(
      'The first of the two assets to fund this AMM with. This must be a positive amount. Can be XRP (string in drops) or a token (currency object)',
    ),
  Amount2: z
    .union([z.string(), xrplCurrencyAmountSchema])
    .describe(
      'The second of the two assets to fund this AMM with. This must be a positive amount. Can be XRP (string in drops) or a token (currency object)',
    ),
  TradingFee: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .describe(
      'The fee to charge for trades against this AMM instance, in units of 1/100,000. A value of 1 is equivalent to 0.001%. Maximum value is 1000 (1% fee). Minimum value is 0 (no fee)',
    ),
})

/**
 * Complete AMMCreate transaction schema
 */
export const xrplAmmCreateSchema = xrplCommonFieldsSchema
  .merge(xrplAmmCreateFieldsSchema)
  .extend({ TransactionType: z.literal('AMMCreate') })

export type XrplAmmCreateFields = z.infer<typeof xrplAmmCreateFieldsSchema>
export type XrplAmmCreate = z.infer<typeof xrplAmmCreateSchema>

/**
 * Helper function to calculate trading fee percentage
 */
export const calculateTradingFeePercentage = (tradingFee: number): number => {
  return (tradingFee / 100000) * 100
}
