import { isMPTAmount, Payment } from 'xrpl'
import { currencyCodeToHex } from '../../../../helpers'
import { useTransactionToolFactory } from '../factory'
import { xrplPaymentSchema } from './payment.types'

const { createTransactionTool } = useTransactionToolFactory({ inputSchema: xrplPaymentSchema })

/**
 * Helper function to process payment amounts (Amount or DeliverMax)
 * Handles string amounts, MPT amounts, and currency objects
 */
const processPaymentAmount = (amount: any): any => {
  // If it's a string (XRP amount in drops), return as is
  if (typeof amount === 'string') {
    return amount
  }

  // If it's an MPT amount, return as is
  if (isMPTAmount(amount)) {
    return amount
  }

  // If it's a currency object, convert currency to hex and return
  if (amount && typeof amount === 'object' && amount.currency) {
    return {
      currency: currencyCodeToHex(amount.currency),
      value: amount.value,
      issuer: amount.issuer,
    }
  }

  // Return as is for any other case
  return amount
}

export const submitPaymentTool = createTransactionTool<Payment>({
  toolId: 'submit-payment',
  description: `Submit a Payment transaction to send XRP, tokens or MPTs. Sending enough XRP to an unfunded address creates the account.

- Provide Amount (API v1) or DeliverMax (API v2).
- XRP amounts are strings in drops. Token amounts are objects {currency, issuer, value}. Currency codes are converted to hex automatically.
- Cross-currency payments need SendMax. Paths are filled in by the server if omitted.
- tfPartialPayment can deliver less than Amount. Check the delivered amount in the result.
- MPT payments are direct transfers only, not DEX trades.`,
  buildTransaction: payment => {
    const builtPayment: Payment = {
      ...payment,
      Amount: payment.DeliverMax ? undefined : processPaymentAmount(payment.Amount),
      DeliverMax: processPaymentAmount(payment.DeliverMax),
    }

    return builtPayment
  },
  validateTransaction: params => {
    if (params.Amount === undefined && params.DeliverMax === undefined) {
      throw new Error('Provide Amount (API v1) or DeliverMax (API v2)')
    }
  },
})
