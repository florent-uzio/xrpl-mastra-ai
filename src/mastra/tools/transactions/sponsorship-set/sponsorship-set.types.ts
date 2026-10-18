import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * SponsorshipSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/sponsorshipset#sponsorshipset-fields
 */
export const xrplSponsorshipSetFieldsSchema = z.object({
  // Exactly one of Sponsee / CounterpartySponsor
  Sponsee: xrplAddressSchema.optional().describe('Sponsee address. Use when Account is the sponsor.'),
  CounterpartySponsor: xrplAddressSchema.optional().describe('Sponsor address. Use when Account is the sponsee.'),

  // Optional fields
  FeeAmountDelta: z
    .string()
    .optional()
    .describe('Change to the fee budget in drops (may be negative). Must be nonzero and positive when creating.'),
  MaxFee: z.string().optional().describe('Maximum fee in drops per sponsored transaction'),
  RemainingOwnerCountDelta: z
    .number()
    .int()
    .optional()
    .describe(
      'Change to the reserve budget in owner counts (may be negative). Must be nonzero and positive when creating.',
    ),
})

/**
 * Complete SponsorshipSet transaction schema
 */
export const xrplSponsorshipSetSchema = xrplCommonFieldsSchema
  .merge(xrplSponsorshipSetFieldsSchema)
  .extend({ TransactionType: z.literal('SponsorshipSet') })

export type XrplSponsorshipSetFields = z.infer<typeof xrplSponsorshipSetFieldsSchema>
export type XrplSponsorshipSet = z.infer<typeof xrplSponsorshipSetSchema>
