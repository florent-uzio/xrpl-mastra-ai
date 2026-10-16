import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplLoanBrokerCoverClawbackSchema } from './loan-broker-cover-clawback.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplLoanBrokerCoverClawbackSchema,
})

export const submitLoanBrokerCoverClawbackTool = createTransactionTool({
  toolId: 'submit-loan-broker-cover-clawback',
  description: `Submit a LoanBrokerCoverClawback transaction to claw back first-loss capital from a loan broker. Only the issuer of the vault's asset can send it. Requires the LendingProtocol amendment.

Provide LoanBrokerID, Amount or both. LoanBrokerID is required when Amount is an MPT or a token whose issuer is the Account. For a token Amount, the issuer field is the token issuer, not the broker owner. If Amount is 0 or omitted, the cover is clawed back down to its minimum (DebtTotal * CoverRateMinimum); it can never go below that minimum.

The asset must match the vault's asset and support clawback and freezing. XRP is not allowed.

Errors: tecNO_PERMISSION (not the issuer, or clawback not supported), tecWRONG_ASSET, tecINSUFFICIENT_FUNDS (would go below minimum cover), tecNO_ENTRY, temINVALID, temBAD_AMOUNT.`,
  buildTransaction: loanBrokerCoverClawback => {
    const { Amount, ...rest } = loanBrokerCoverClawback
    return Amount === undefined ? rest : { ...rest, Amount: encodeCurrencyCodes(Amount) }
  },
})
