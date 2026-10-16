import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplLoanBrokerCoverWithdrawSchema } from './loan-broker-cover-withdraw.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplLoanBrokerCoverWithdrawSchema,
})

export const submitLoanBrokerCoverWithdrawTool = createTransactionTool({
  toolId: 'submit-loan-broker-cover-withdraw',
  description: `Submit a LoanBrokerCoverWithdraw transaction to withdraw first-loss capital from a loan broker. Only the broker owner can send it. Requires the LendingProtocol and fixCleanup3_4_0 amendments.

Amount is XRP in drops, or {currency, issuer, value} for a token, or {mpt_issuance_id, value} for an MPT. It must match the vault's asset and be greater than 0. Destination defaults to the sender. DestinationTag requires Destination.

Errors: tecINSUFFICIENT_FUNDS (not enough cover), tecWRONG_ASSET, tecNO_PERMISSION (not the broker owner), tecNO_DST, tecDST_TAG_NEEDED, tecFROZEN, tecLOCKED, tecPATH_DRY, tecNO_ENTRY.`,
  buildTransaction: loanBrokerCoverWithdraw => {
    return { ...loanBrokerCoverWithdraw, Amount: encodeCurrencyCodes(loanBrokerCoverWithdraw.Amount) }
  },
})
