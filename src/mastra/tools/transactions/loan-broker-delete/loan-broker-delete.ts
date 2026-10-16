import { useTransactionToolFactory } from '../factory'
import { xrplLoanBrokerDeleteSchema } from './loan-broker-delete.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplLoanBrokerDeleteSchema,
})

export const submitLoanBrokerDeleteTool = createTransactionTool({
  toolId: 'submit-loan-broker-delete',
  description: `Submit a LoanBrokerDelete transaction to delete a loan broker. Only the broker owner can send it. Requires the LendingProtocol amendment.

The broker must have no active loans, and its pseudo-account must hold no balance and own no entries. Withdraw remaining first-loss capital with LoanBrokerCoverWithdraw first.

Errors: tecHAS_OBLIGATIONS (loans or balance remain), tecNO_PERMISSION (not the owner), tecNO_ENTRY.`,
  buildTransaction: loanBrokerDelete => {
    return loanBrokerDelete
  },
})
