import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * EscrowCancel-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/escrowcancel#escrowcancel-fields
 */
export const xrplEscrowCancelFieldsSchema = z.object({
  Owner: xrplAddressSchema.describe('The address of the account that funded the escrow (the EscrowCreate sender)'),
  OfferSequence: z
    .number()
    .int()
    .gte(0)
    .describe(
      'Transaction sequence (or Ticket number) of the EscrowCreate transaction that created the escrow to cancel',
    ),
})

/**
 * Complete EscrowCancel transaction schema
 */
export const xrplEscrowCancelSchema = xrplCommonFieldsSchema
  .merge(xrplEscrowCancelFieldsSchema)
  .extend({ TransactionType: z.literal('EscrowCancel') })

export type XrplEscrowCancelFields = z.infer<typeof xrplEscrowCancelFieldsSchema>
export type XrplEscrowCancel = z.infer<typeof xrplEscrowCancelSchema>
