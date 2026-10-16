import { currencyCodeToHex, isString, isUndefined } from '../../../../helpers'
import { useTransactionToolFactory } from '../factory'
import { xrplAmmCreateSchema } from './amm-create.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplAmmCreateSchema,
})

export const submitAmmCreateTool = createTransactionTool({
  toolId: 'submit-amm-create',
  description: `Submit an AMMCreate transaction to create an AMM pool for an asset pair. The creator receives LP tokens.

Fields:
- Amount and Amount2: the two assets and their initial deposits (XRP in drops, or {currency, issuer, value}). Fund them at roughly equal value.
- TradingFee: 0-1000, in units of 0.001% (1000 = 1%).

Rules: at most one asset may be XRP. The assets must differ. Token issuers need DefaultRipple enabled. You cannot use another AMM's LP tokens. Creation costs an elevated fee of about 0.2 XRP (the owner reserve) and adds a trust line for the LP tokens.

Errors: tecDUPLICATE (pool already exists), tecUNFUNDED_AMM, tecNO_LINE, tecFROZEN, terNO_RIPPLE.`,
  buildTransaction: ammCreate => {
    const { Amount, Amount2, ...rest } = ammCreate

    // Convert Amount and Amount2 to hex if they are strings
    return {
      Amount: isString(Amount)
        ? Amount
        : {
            ...Amount,
            currency: currencyCodeToHex(Amount.currency),
          },
      Amount2: isString(Amount2)
        ? Amount2
        : {
            ...Amount2,
            currency: currencyCodeToHex(Amount2.currency),
          },
      ...rest,
    }
  },
  validateTransaction: params => {
    if (isUndefined(params.Amount) || isUndefined(params.Amount2)) {
      throw new Error('Both Amount and Amount2 must be provided for AMMCreate')
    }

    if (params.TradingFee < 0 || params.TradingFee > 1000) {
      throw new Error('TradingFee must be between 0 and 1000')
    }
  },
})

/**
 * Helper function to calculate trading fee percentage
 */
export const calculateTradingFeePercentage = (tradingFee: number): number => {
  return (tradingFee / 100000) * 100
}
