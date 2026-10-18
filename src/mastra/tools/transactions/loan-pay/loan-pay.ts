import { LoanPay } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplLoanPaySchema } from './loan-pay.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplLoanPaySchema,
})

export const submitLoanPayTool = createTransactionTool<LoanPay>({
  toolId: 'submit-loan-pay',
  description: `Submit a LoanPay transaction to make a payment on a loan. Only the borrower can send it. Requires the LendingProtocol amendment.

Amount is XRP in drops, or {currency, issuer, value} for a token, or {mpt_issuance_id, value} for an MPT. It must be the loan's asset and at least the minimum for the payment type.

Payment types (set at most one flag in Flags, none for a regular on-time payment):
- tfLoanLatePayment (262144): payment after the due date, includes the late fee and late interest. Required when the payment is late (fixCleanup3_4_0).
- tfLoanFullPayment (131072): early full repayment of the outstanding principal, using the close interest rate
- tfLoanOverpayment (65536): treat the amount above the minimum as an overpayment (the loan must allow overpayments)

A payment exactly at the due date counts as on time.

Errors: tecINSUFFICIENT_PAYMENT, tecINSUFFICIENT_FUNDS, tecEXPIRED (late without tfLoanLatePayment), tecNO_PERMISSION (not the borrower, or overpayments not allowed), tecTOO_SOON (loan not started), tecKILLED (already paid), tecWRONG_ASSET, tecFROZEN, tecLOCKED, tecNO_AUTH, tecNO_LINE, tecPRECISION_LOSS, tecNO_ENTRY.`,
  buildTransaction: loanPay => {
    return { ...loanPay, Amount: encodeCurrencyCodes(loanPay.Amount) }
  },
})
