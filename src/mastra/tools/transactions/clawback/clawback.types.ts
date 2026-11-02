import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCurrencyAmountSchema, xrplMptAmountSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * Clawback-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/clawback#clawback-fields
 */
export const xrplClawbackFieldsSchema = z.object({
  // Required field
  Amount: z
    .union([xrplCurrencyAmountSchema, xrplMptAmountSchema])
    .describe(
      "The amount to claw back. A trust line token is {currency, issuer, value} where issuer is the HOLDER's address, not the issuer's. An MPT is {mpt_issuance_id, value}, with the holder in Holder. The value must be greater than zero.",
    ),

  // Required for an MPT, forbidden for a trust line token (checked in validateTransaction)
  Holder: xrplAddressSchema
    .optional()
    .describe(
      "MPT only (required for an MPT, not allowed for a trust line token): the holder's address to claw back from. The holder must own an MPToken with a non-zero balance.",
    ),
})

/**
 * Complete Clawback transaction schema
 */
export const xrplClawbackSchema = xrplCommonFieldsSchema
  .merge(xrplClawbackFieldsSchema)
  .extend({ TransactionType: z.literal('Clawback') })

export type XrplClawbackFields = z.infer<typeof xrplClawbackFieldsSchema>
export type XrplClawback = z.infer<typeof xrplClawbackSchema>
