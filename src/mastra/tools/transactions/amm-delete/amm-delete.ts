import { AMMDelete } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplAmmDeleteSchema } from './amm-delete.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplAmmDeleteSchema,
})

export const submitAmmDeleteTool = createTransactionTool<AMMDelete>({
  toolId: 'submit-amm-delete',
  description: `Submit an AMMDelete transaction to delete an empty AMM (one with no assets left in its pool, which happens after all LP tokens were withdrawn). Asset and Asset2 identify the AMM (XRP as {currency: "XRP"}, or {currency, issuer}).

Rules: only needed when a previous AMMWithdraw (tfWithdrawAll) could not delete all the AMM's trust lines in one transaction. If it still has too many trust lines, it deletes up to 512 and returns tecINCOMPLETE; resubmit until it succeeds.

Errors: terNO_AMM (no such AMM), tecAMM_NOT_EMPTY (AMM still has assets), tecINCOMPLETE (more trust lines remain, resubmit).`,
  buildTransaction: ammDelete => {
    return {
      ...ammDelete,
      Asset: encodeCurrencyCodes(ammDelete.Asset),
      Asset2: encodeCurrencyCodes(ammDelete.Asset2),
    }
  },
})
