import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * OfferCancel-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/offercancel#offercancel-fields
 */
export const xrplOfferCancelFieldsSchema = z.object({
  // Required field
  OfferSequence: z
    .number()
    .int()
    .gte(0)
    .describe(
      'The sequence number (or Ticket number) of a previous OfferCreate transaction. If specified, cancel any offer object in the ledger that was created by that transaction. It is not considered an error if the offer specified does not exist.',
    ),
})

/**
 * Complete OfferCancel transaction schema
 */
export const xrplOfferCancelSchema = xrplCommonFieldsSchema
  .merge(xrplOfferCancelFieldsSchema)
  .extend({ TransactionType: z.literal('OfferCancel') })

export type XrplOfferCancelFields = z.infer<typeof xrplOfferCancelFieldsSchema>
export type XrplOfferCancel = z.infer<typeof xrplOfferCancelSchema>
