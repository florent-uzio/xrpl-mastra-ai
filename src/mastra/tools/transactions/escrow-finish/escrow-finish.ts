import { EscrowFinish } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplEscrowFinishSchema } from './escrow-finish.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplEscrowFinishSchema,
})

export const submitEscrowFinishTool = createTransactionTool<EscrowFinish>({
  toolId: 'submit-escrow-finish',
  description: `Submit an EscrowFinish transaction to release escrowed funds to the escrow's Destination. Anyone can send it once the conditions are met.

Fields:
- Owner: address that created the escrow.
- OfferSequence: sequence (or Ticket number) of the EscrowCreate transaction.
- Condition + Fulfillment: hex PREIMAGE-SHA-256 pair, required together for conditional escrows; omit for time-only escrows.
- CredentialIDs (optional): up to 8 credential IDs for deposit-authorized destinations.

Rules: FinishAfter (seconds since the Ripple Epoch) must have passed, and CancelAfter must not have passed. Fulfillments raise the fee (330 drops + 10 per 16 bytes). Find escrows with get-account-objects (type "escrow").

Errors: tecNO_TARGET (escrow not found), tecNO_PERMISSION (time not reached/expired, or bad fulfillment), tecCRYPTOCONDITION_ERROR, tecBAD_CREDENTIALS.`,
  buildTransaction: escrowFinish => {
    return escrowFinish
  },
})
