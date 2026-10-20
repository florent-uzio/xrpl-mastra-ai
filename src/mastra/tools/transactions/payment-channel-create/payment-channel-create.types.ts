import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * PaymentChannelCreate-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/paymentchannelcreate#paymentchannelcreate-fields
 */
export const xrplPaymentChannelCreateFieldsSchema = z.object({
  // Required fields
  Amount: z
    .string()
    .regex(/^\d+$/)
    .describe('Amount of XRP, in drops, to set aside in this channel. Deducted from the sender balance immediately.'),
  Destination: xrplAddressSchema.describe(
    'Address (r-address) that can receive XRP from the channel, also known as the destination account. Cannot be the sender.',
  ),
  SettleDelay: z
    .number()
    .int()
    .gte(0)
    .describe(
      'Amount of time, in seconds, the source address must wait before closing the channel if it has unclaimed XRP.',
    ),
  PublicKey: z
    .string()
    .describe(
      'Hex public key (33 bytes, 66 hex characters) of the key pair the source uses to sign claims against this channel. Can be an secp256k1 or Ed25519 key.',
    ),

  // Optional fields
  CancelAfter: z
    .number()
    .int()
    .optional()
    .describe(
      'Time, in seconds since the Ripple Epoch, when this channel expires. Any transaction that would modify the channel after this time closes it. Cannot be changed later.',
    ),
  DestinationTag: z
    .number()
    .int()
    .min(0)
    .max(4294967295)
    .optional()
    .describe(
      'Arbitrary 32-bit tag identifying the reason for the channel or the beneficiary at the destination, such as a hosted recipient.',
    ),
})

/**
 * Complete PaymentChannelCreate transaction schema
 */
export const xrplPaymentChannelCreateSchema = xrplCommonFieldsSchema
  .merge(xrplPaymentChannelCreateFieldsSchema)
  .extend({ TransactionType: z.literal('PaymentChannelCreate') })

export type XrplPaymentChannelCreateFields = z.infer<typeof xrplPaymentChannelCreateFieldsSchema>
export type XrplPaymentChannelCreate = z.infer<typeof xrplPaymentChannelCreateSchema>
