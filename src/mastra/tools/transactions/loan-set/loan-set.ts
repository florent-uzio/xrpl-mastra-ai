import { LoanSet } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplLoanSetSchema } from './loan-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplLoanSetSchema,
})

export const submitLoanSetTool = createTransactionTool<LoanSet>({
  toolId: 'submit-loan-set',
  description: `Submit a LoanSet transaction to create a loan between a loan broker and a borrower. Requires the LendingProtocol amendment.

Both the broker owner and the borrower must sign, and a seed here only signs as Account (missing CounterpartySignature = temBAD_SIGNER). On testnet/devnet, use sign-loan-set with both seeds instead, then submit its tx_blob with submit-signed-blob. On mainnet, use prepare-loan-set, have both parties sign on their own machines, then pass the fully signed transaction (with CounterpartySignature) in "signature".

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
