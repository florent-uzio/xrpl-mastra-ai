import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHash256Schema } from '../shared'

/**
 * PaymentChannelFund-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/paymentchannelfund#paymentchannelfund-fields
 */
export const xrplPaymentChannelFundFieldsSchema = z.object({
  // Required fields
  Channel: xrplHash256Schema.describe('The ID of the payment channel (64 hex characters) to add XRP to.'),
  Amount: z
    .string()
    .regex(/^\d+$/)
    .describe(
      'Amount of XRP, in drops, to add to the channel. Must be positive. Deducted from the sender balance and added to the channel Amount.',
    ),

  // Optional field
  Expiration: z
    .number()
    .int()
    .optional()
    .describe(
      'New Expiration time, in seconds since the Ripple Epoch, to set on the channel. Must be later than the current ledger close time plus the SettleDelay, and not later than an existing earlier expiration (it can only move the expiration further out than the current one is allowed to be earlier). Can only be set by the channel source.',
    ),
})

/**
 * Complete PaymentChannelFund transaction schema
 */
export const xrplPaymentChannelFundSchema = xrplCommonFieldsSchema
  .merge(xrplPaymentChannelFundFieldsSchema)
  .extend({ TransactionType: z.literal('PaymentChannelFund') })

export type XrplPaymentChannelFundFields = z.infer<typeof xrplPaymentChannelFundFieldsSchema>
export type XrplPaymentChannelFund = z.infer<typeof xrplPaymentChannelFundSchema>
