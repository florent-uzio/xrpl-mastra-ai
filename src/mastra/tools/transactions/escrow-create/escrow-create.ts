import { EscrowCreate } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplEscrowCreateSchema } from './escrow-create.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplEscrowCreateSchema,
})

export const submitEscrowCreateTool = createTransactionTool<EscrowCreate>({
  toolId: 'submit-escrow-create',
  description: `Submit an EscrowCreate transaction to lock funds until a time and/or crypto-condition is met. Supports XRP, trust line tokens and MPTs (issuer must allow escrow).

Fields:
- Amount: XRP in drops, or {currency, issuer, value}, or {mpt_issuance_id, value}.
- Destination: who receives the funds on release.
- FinishAfter: earliest time the escrow can be finished (seconds since the Ripple Epoch, 2000-01-01, not Unix time).
- CancelAfter: time after which the escrow can only be cancelled (same unit); must be later than FinishAfter.
- Condition: hex PREIMAGE-SHA-256 condition; finishing then requires the matching Fulfillment.
- DestinationTag (optional).

Rules: at least one of CancelAfter or FinishAfter is required; a Condition without FinishAfter requires CancelAfter. Times must be in the future. The escrow costs an owner reserve. Note the sequence of this transaction: it is the OfferSequence for EscrowFinish/EscrowCancel.

Errors: temBAD_EXPIRATION, tecNO_DST, tecDST_TAG_NEEDED, tecUNFUNDED, tecINSUFFICIENT_RESERVE, tecNO_PERMISSION (token does not allow escrow).`,
  buildTransaction: escrowCreate => {
    const { Amount, ...rest } = escrowCreate

    return {
      ...rest,
      Amount: encodeCurrencyCodes(Amount),
    } as EscrowCreate
  },
})
