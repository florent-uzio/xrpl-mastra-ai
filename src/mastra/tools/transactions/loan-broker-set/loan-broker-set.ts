import { LoanBrokerSet } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplLoanBrokerSetSchema } from './loan-broker-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplLoanBrokerSetSchema,
})

export const submitLoanBrokerSetTool = createTransactionTool<LoanBrokerSet>({
  toolId: 'submit-loan-broker-set',
  description: `Submit a LoanBrokerSet transaction to create or update a loan broker linked to a vault. Only the vault owner can send it. Requires the LendingProtocol amendment.

Omit LoanBrokerID to create a broker. Set it to update one: only Data and DebtMaximum can change. New brokers can only use a closed-ended vault (LendingProtocolV1_1). The response contains the new LoanBroker ID.

Rates are in 1/10 basis points (1 = 0.001%, 100000 = 100%). ManagementFeeRate is 0 to 10000. CoverRateMinimum and CoverRateLiquidation must both be zero or both non-zero.

Errors: tecNO_PERMISSION (not the vault or broker owner, VaultID changed, or non-closed-ended vault), tecNO_ENTRY, tecLIMIT_EXCEEDED (DebtMaximum below DebtTotal), tecINSUFFICIENT_RESERVE, tecPRECISION_LOSS, temINVALID.`,
  buildTransaction: loanBrokerSet => {
    return loanBrokerSet
  },
})
