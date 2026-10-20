import { z } from 'zod'
import { xrplDecimalValueSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHash256Schema } from '../shared'

/**
 * PaymentChannelClaim-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/paymentchannelclaim#paymentchannelclaim-fields
 */
export const xrplPaymentChannelClaimFieldsSchema = z.object({
  // Required field
  Channel: xrplHash256Schema.describe('The ID of the payment channel (64 hex characters) to claim XRP from.'),

  // Optional fields
  Balance: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .describe(
      'Total XRP, in drops, delivered by this channel after this claim (cumulative, not incremental). Required unless the channel source is only closing/renewing the channel. Must be more than the Balance already delivered and not more than Amount.',
    ),
  Amount: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .describe(
      'Total XRP, in drops, authorized by the claim Signature. Required when Signature is provided. Must match the amount in the signed claim.',
    ),
  Signature: z
    .string()
    .optional()
    .describe(
      'Hex signature of the claim, produced by the channel source key for Channel and Amount. Required when the destination claims funds. Must be omitted when the source claims or renews. Requires PublicKey.',
    ),
  PublicKey: z
    .string()
    .optional()
    .describe(
      'Hex public key of the key pair that produced Signature. Must match the PublicKey of the channel. Required if Signature is provided.',
    ),
  CredentialIDs: z
    .array(xrplHash256Schema)
    .optional()
    .describe(
      'Credential ledger entry IDs (64 hex characters each) that authorize the sender to claim into a destination using Deposit Authorization. Requires the Credentials amendment.',
    ),
})

/**
 * Complete PaymentChannelClaim transaction schema
 */
export const xrplPaymentChannelClaimSchema = xrplCommonFieldsSchema
  .merge(xrplPaymentChannelClaimFieldsSchema)
  .extend({ TransactionType: z.literal('PaymentChannelClaim') })

export type XrplPaymentChannelClaimFields = z.infer<typeof xrplPaymentChannelClaimFieldsSchema>
export type XrplPaymentChannelClaim = z.infer<typeof xrplPaymentChannelClaimSchema>
