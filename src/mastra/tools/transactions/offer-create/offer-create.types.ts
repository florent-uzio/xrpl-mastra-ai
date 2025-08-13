import { z } from 'zod'
import { xrplCurrencyAmountSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * OfferCreate flags that can be used to control offer behavior
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/offercreate#offercreate-flags
 */
export const OfferCreateFlagsSchema = z.enum([
  'tfPassive', // 65536 - Do not consume offers that exactly match, only cross offers
  'tfImmediateOrCancel', // 131072 - Immediate or Cancel order, don't place in order book
  'tfFillOrKill', // 262144 - Fill or Kill order, cancel if not fully filled
  'tfSell', // 524288 - Exchange entire TakerGets amount, even if getting more than TakerPays
  'tfHybrid', // 1048576 - Hybrid offer using both permissioned and open DEX (requires DomainID)
])

export type OfferCreateFlags = z.infer<typeof OfferCreateFlagsSchema>

/**
 * OfferCreate-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/offercreate#offercreate-fields
 */
export const xrplOfferCreateFieldsSchema = z.object({
  // Required fields
  TakerGets: z
    .union([z.string(), xrplCurrencyAmountSchema])
    .describe('The amount and type of currency being sold. Can be XRP (string in drops) or a token (currency object)'),
  TakerPays: z
    .union([z.string(), xrplCurrencyAmountSchema])
    .describe(
      'The amount and type of currency being bought. Can be XRP (string in drops) or a token (currency object)',
    ),

  // Optional fields
  Expiration: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe('Time after which the Offer is no longer active, in seconds since the Ripple Epoch'),
  OfferSequence: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe(
      "An Offer to delete first, specified in the same way as OfferCancel. Must be less than the transaction's own Sequence number.",
    ),
  DomainID: z
    .string()
    .optional()
    .describe(
      'The ledger entry ID of a permissioned domain. If provided, restrict this offer to the permissioned DEX of that domain. Requires the PermissionedDEX amendment.',
    ),
})

/**
 * Complete OfferCreate transaction schema
 */
export const xrplOfferCreateSchema = xrplCommonFieldsSchema
  .merge(xrplOfferCreateFieldsSchema)
  .extend({ TransactionType: z.literal('OfferCreate') })

export type XrplOfferCreateFields = z.infer<typeof xrplOfferCreateFieldsSchema>
export type XrplOfferCreate = z.infer<typeof xrplOfferCreateSchema>

/**
 * Helper function to convert OfferCreate flag names to numeric values
 */
export const getOfferCreateFlagValue = (flagName: OfferCreateFlags): number => {
  const flagValues: Record<OfferCreateFlags, number> = {
    tfPassive: 65536,
    tfImmediateOrCancel: 131072,
    tfFillOrKill: 262144,
    tfSell: 524288,
    tfHybrid: 1048576,
  }
  return flagValues[flagName]
}
