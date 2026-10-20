import { EscrowCancel } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplEscrowCancelSchema } from './escrow-cancel.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplEscrowCancelSchema,
})

export const submitEscrowCancelTool = createTransactionTool<EscrowCancel>({
  toolId: 'submit-escrow-cancel',
  description: `Submit an EscrowCancel transaction to return an expired escrow's funds to its creator. Anyone can send it.

Fields:
- Owner: address that created the escrow.
- OfferSequence: sequence (or Ticket number) of the EscrowCreate transaction that created the escrow.

Rules: the escrow must have a CancelAfter time (seconds since the Ripple Epoch) that has already passed; escrows without CancelAfter can never be cancelled. Find escrows with get-account-objects (type "escrow").

Errors: tecNO_TARGET (escrow not found), tecNO_PERMISSION (no CancelAfter, or not yet reached).`,
  buildTransaction: escrowCancel => {
    return escrowCancel
  },
})
