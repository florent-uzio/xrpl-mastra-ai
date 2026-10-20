import { TicketCreate } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplTicketCreateSchema } from './ticket-create.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplTicketCreateSchema,
})

export const submitTicketCreateTool = createTransactionTool<TicketCreate>({
  toolId: 'submit-ticket-create',
  description: `Submit a TicketCreate transaction to set aside sequence numbers (Tickets) that can be used later to send transactions out of order.

TicketCount is 1 to 250. An account can hold at most 250 Tickets, and each Ticket requires one owner reserve. The created Tickets take the next sequence numbers after this transaction; use one in a later transaction by setting TicketSequence and Sequence to 0.

Common errors: tecDIR_FULL or tecINSUFFICIENT_RESERVE (reserve not met), tecTOO_MANY_TICKETS (would exceed 250), temINVALID_COUNT.`,
  buildTransaction: params => {
    return params
  },
})
