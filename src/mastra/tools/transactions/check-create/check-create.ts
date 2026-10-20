import { CheckCreate } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplCheckCreateSchema } from './check-create.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplCheckCreateSchema,
})

export const submitCheckCreateTool = createTransactionTool<CheckCreate>({
  toolId: 'submit-check-create',
  description: `Submit a CheckCreate transaction to create a Check: a deferred payment the Destination can later cash with CheckCash. No funds move until it is cashed.

Fields:
- Destination: account allowed to cash the Check (not yourself).
- SendMax: maximum amount debited from you (XRP in drops, or {currency, issuer, value}), including transfer fees.
- Expiration (optional): seconds since the Ripple Epoch (2000-01-01), not Unix time.
- DestinationTag, InvoiceID (optional, 64 hex chars).

Rules: the Check is a ledger object that costs the sender an owner reserve until cashed, cancelled or expired. The sender does not need to hold the funds at creation. Frozen assets cannot be used.

Errors: tecDST_TAG_NEEDED, tecNO_DST, tecNO_PERMISSION (destination blocks incoming Checks/DepositAuth), tecFROZEN, tecINSUFFICIENT_RESERVE, temBAD_EXPIRATION.`,
  buildTransaction: checkCreate => {
    const { SendMax, ...rest } = checkCreate

    return {
      ...rest,
      SendMax: encodeCurrencyCodes(SendMax),
    } as CheckCreate
  },
})
