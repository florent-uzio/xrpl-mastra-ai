import { useTransactionToolFactory } from '../factory'
import { xrplLoanDeleteSchema } from './loan-delete.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplLoanDeleteSchema,
})

export const submitLoanDeleteTool = createTransactionTool({
  toolId: 'submit-loan-delete',
  description: `Submit a LoanDelete transaction to delete a loan. Either the borrower or the loan broker owner can send it, and the loan must have no outstanding payments due. Requires the LendingProtocol amendment.

Errors: tecHAS_OBLIGATIONS (payments still due), tecNO_PERMISSION (neither borrower nor broker owner), tecNO_ENTRY.`,
  buildTransaction: loanDelete => {
    return loanDelete
  },
})
