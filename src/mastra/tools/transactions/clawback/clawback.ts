import { Clawback, isMPTAmount } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplClawbackSchema } from './clawback.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplClawbackSchema,
})

export const submitClawbackTool = createTransactionTool<Clawback>({
  toolId: 'submit-clawback',
  description: `Submit a Clawback transaction. A token issuer recovers issued tokens from a holder.

Prerequisites: the issuer must have set asfAllowTrustLineClawback (16) before holding any trust lines, offers or escrows. It is permanent and cannot be combined with NoFreeze.

Amount is {currency, issuer, value}. The issuer field holds the HOLDER's address, not the issuer's. The Account is the issuer. XRP is not allowed, value must be > 0, and you cannot claw back from yourself. If value exceeds the holder's balance, the whole balance is recovered.

Holder is only for MPTs. For AMM accounts use AMMClawback.

Errors: tecNO_PERMISSION (clawback not enabled), tecNO_LINE (no trust line or zero balance), tecAMM_ACCOUNT.`,
  validateTransaction: params => {
    if (!params.Amount || parseFloat(params.Amount.value) <= 0) {
      throw new Error('Amount value must be greater than zero')
    }

    // MPT amounts have no currency or issuer: the holder is in Holder
    if (isMPTAmount(params.Amount)) {
      if (!params.Holder) {
        throw new Error('Holder is required to claw back an MPT')
      }
      if (params.Holder === params.Account) {
        throw new Error('Cannot claw back from yourself - Holder cannot be the same as the Account')
      }
      return
    }

    if (params.Holder) {
      throw new Error('Holder is only for MPTs: for a trust line token, put the holder in Amount.issuer')
    }

    if (params.Amount.currency.toUpperCase() === 'XRP') {
      throw new Error('Clawback cannot be used with XRP - only issued tokens can be clawed back')
    }

    if (params.Amount.issuer === params.Account) {
      throw new Error('Cannot claw back from yourself - the holder cannot be the same as the Account')
    }
  },
})
