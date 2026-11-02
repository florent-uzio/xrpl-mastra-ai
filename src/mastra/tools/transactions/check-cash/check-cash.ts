import { CheckCash } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplCheckCashSchema } from './check-cash.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplCheckCashSchema,
})

export const submitCheckCashTool = createTransactionTool<CheckCash>({
  toolId: 'submit-check-cash',
  description: `Submit a CheckCash transaction to redeem a Check and receive its funds. Only the Check's Destination can send it.

Fields:
- CheckID: 64-character hex ID of the Check (find it with get-account-objects, type "check").
- Amount: exact amount to receive (XRP in drops, or {currency, issuer, value}); must match the Check's SendMax currency and not exceed it.
- DeliverMin: alternative to Amount; receive as much as possible, but at least this much.
Provide exactly one of Amount or DeliverMin.

Rules: fails if the Check has expired or the sender lacks funds. For tokens, the destination needs a trust line (created automatically only for XRP).

Errors: tecNO_ENTRY, tecNO_PERMISSION (not the destination), tecEXPIRED, tecPATH_PARTIAL (insufficient funds or DeliverMin not met), tecNO_LINE.`,
})
