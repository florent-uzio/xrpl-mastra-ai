import { CheckCancel } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplCheckCancelSchema } from './check-cancel.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplCheckCancelSchema,
})

export const submitCheckCancelTool = createTransactionTool<CheckCancel>({
  toolId: 'submit-check-cancel',
  description: `Submit a CheckCancel transaction to remove a Check from the ledger without cashing it.

Fields:
- CheckID: 64-character hex ID of the Check ledger entry (find it with get-account-objects, type "check").

Rules: the Check's sender or destination can cancel it at any time; anyone can cancel it once its Expiration has passed. Cancelling frees the sender's owner reserve.

Errors: tecNO_ENTRY (Check does not exist), tecNO_PERMISSION (not sender/destination and Check not expired).`,
  buildTransaction: checkCancel => {
    return checkCancel
  },
})
