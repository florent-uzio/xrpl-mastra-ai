import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * TicketCreate-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/ticketcreate#ticketcreate-fields
 */
export const xrplTicketCreateFieldsSchema = z.object({
  // Required field
  TicketCount: z
    .number()
    .int()
    .min(1)
    .max(250)
    .describe(
      'How many Tickets to create, from 1 to 250 inclusive. An account can hold at most 250 Tickets at once, and each Ticket adds one owner reserve.',
    ),
})

/**
 * Complete TicketCreate transaction schema
 */
export const xrplTicketCreateSchema = xrplCommonFieldsSchema
  .merge(xrplTicketCreateFieldsSchema)
  .extend({ TransactionType: z.literal('TicketCreate') })

export type XrplTicketCreateFields = z.infer<typeof xrplTicketCreateFieldsSchema>
export type XrplTicketCreate = z.infer<typeof xrplTicketCreateSchema>
