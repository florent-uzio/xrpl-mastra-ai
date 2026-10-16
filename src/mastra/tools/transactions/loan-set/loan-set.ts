import { useTransactionToolFactory } from '../factory'
import { xrplLoanSetSchema } from './loan-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplLoanSetSchema,
})

export const submitLoanSetTool = createTransactionTool({
  toolId: 'submit-loan-set',
  description: `Submit a LoanSet transaction to create a loan between a loan broker and a borrower. Requires the LendingProtocol amendment.

Both the broker owner and the borrower must sign. Either one prepares and signs the terms (setting Counterparty), the other adds the CounterpartySignature and submits. Because of this, pass the fully signed transaction in "signature" rather than a seed, unless CounterpartySignature is already in the transaction.

Required: LoanBrokerID and PrincipalRequested (in the vault asset). The other terms are optional:
- InterestRate, LateInterestRate, CloseInterestRate, OverpaymentInterestRate, OverpaymentFee: 1/10 basis points (1 = 0.001%), 0 to 100000
- LoanOriginationFee, LoanServiceFee, LatePaymentFee, ClosePaymentFee: amounts paid to the broker owner
- PaymentTotal (number of payments), PaymentInterval (seconds), GracePeriod (seconds, 60 to PaymentInterval)

Flag: tfLoanOverpayment (65536) allows overpayments.

For closed-ended vaults, loans can only be created in the investment phase and the last payment must be at least 60 seconds before RedemptionDate.

Errors: tecINSUFFICIENT_FUNDS (vault lacks funds or broker cover is too low), tecLIMIT_EXCEEDED (DebtMaximum or AssetsMaximum), tecNO_PERMISSION, tecTOO_SOON, tecEXPIRED, tecPRECISION_LOSS, tecKILLED, temBAD_SIGNER (missing CounterpartySignature), tecNO_ENTRY.`,
  buildTransaction: loanSet => {
    return loanSet
  },
})
