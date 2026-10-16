import { currencyCodeToHex } from '../../../../helpers'
import { useTransactionToolFactory } from '../factory'
import { xrplTrustSetSchema } from './trustset.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplTrustSetSchema,
})

export const submitTrustSetTool = createTransactionTool({
  toolId: 'submit-trustset',
  description: `Submit a TrustSet transaction to create or modify a trust line so an account can hold a token. Not valid for XRP. The issuer cannot be the sender. Each trust line adds to the account's reserve. Currency codes are converted to hex automatically.

Flags:
- tfSetfAuth: issuer authorizes the holder (only relevant with asfRequireAuth; cannot be undone)
- tfSetNoRipple / tfClearNoRipple: block or allow rippling. Holders usually set NoRipple.
- tfSetFreeze / tfClearFreeze: freeze or unfreeze (issuer only)
- tfSetDeepFreeze / tfClearDeepFreeze: deep freeze or clear it

QualityIn / QualityOut: 0 = face value. Values are in parts per billion, so 1,000,000,000 = 1:1.

Errors: tecNO_PERMISSION means the issuer blocks incoming trust lines or No Ripple cannot be enabled.`,
  buildTransaction: params => {
    const { LimitAmount, ...rest } = params
    return {
      LimitAmount: {
        currency: currencyCodeToHex(LimitAmount.currency),
        value: LimitAmount.value,
        issuer: LimitAmount.issuer,
      },
      ...rest,
    }
  },
  validateTransaction: txn => {
    if (txn.LimitAmount.currency === 'XRP') {
      throw new Error('XRP is not allowed for TrustSet')
    }

    if (txn.LimitAmount.issuer === txn.Account) {
      throw new Error('Cannot create trust line to yourself (issuer cannot be the same as Account)')
    }
  },
})
