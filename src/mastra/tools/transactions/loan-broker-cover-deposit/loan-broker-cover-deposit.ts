import { LoanBrokerCoverDeposit } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplLoanBrokerCoverDepositSchema } from './loan-broker-cover-deposit.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplLoanBrokerCoverDepositSchema,
})

export const submitLoanBrokerCoverDepositTool = createTransactionTool<LoanBrokerCoverDeposit>({
  toolId: 'submit-loan-broker-cover-deposit',
  description: `Submit a LoanBrokerCoverDeposit transaction to deposit first-loss capital into a loan broker, which protects the vault's depositors. Only the broker owner can send it. Requires the LendingProtocol amendment.

Amount is XRP in drops, or {currency, issuer, value} for a token, or {mpt_issuance_id, value} for an MPT. It must match the vault's asset and be greater than 0.

Errors: tecWRONG_ASSET, tecINSUFFICIENT_FUNDS, tecNO_PERMISSION (not the broker owner), tecFROZEN, tecLOCKED, tecNO_ENTRY.`,
  buildTransaction: loanBrokerCoverDeposit => {
    return { ...loanBrokerCoverDeposit, Amount: encodeCurrencyCodes(loanBrokerCoverDeposit.Amount) }
  },
})
