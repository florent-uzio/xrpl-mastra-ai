import { TrustSet } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplTrustSetSchema } from './trustset.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplTrustSetSchema,
})

export const submitTrustSetTool = createTransactionTool<TrustSet>({
  toolId: 'submit-trustset',
  description: `Submit a TrustSet transaction to create or modify a trust line so an account can hold a token. Not valid for XRP. The issuer cannot be the sender. Each trust line adds to the account's reserve. Currency codes are converted to hex automatically.

Flags is a number: add the values of the flags you want, e.g. tfSetNoRipple + tfSetFreeze = 1179648.
- tfSetfAuth 65536: issuer authorizes the holder (only relevant with asfRequireAuth; cannot be undone)
- tfSetNoRipple 131072 / tfClearNoRipple 262144: block or allow rippling. Holders usually set NoRipple.
- tfSetFreeze 1048576 / tfClearFreeze 2097152: freeze or unfreeze (issuer only)
- tfSetDeepFreeze 4194304 / tfClearDeepFreeze 8388608: deep freeze or clear it

QualityIn / QualityOut: 0 = face value. Values are in parts per billion, so 1,000,000,000 = 1:1.

Errors: tecNO_PERMISSION means the issuer blocks incoming trust lines or No Ripple cannot be enabled.`,
  validateTransaction: txn => {
    if (txn.LimitAmount.currency === 'XRP') {
      throw new Error('XRP is not allowed for TrustSet')
    }

    if (txn.LimitAmount.issuer === txn.Account) {
      throw new Error('Cannot create trust line to yourself (issuer cannot be the same as Account)')
    }
  },
})
