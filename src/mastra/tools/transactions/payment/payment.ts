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

export const submitPaymentTool = createTransactionTool({
  toolId: 'submit-payment',
  description: `Submit a Payment transaction to the XRPL network. A Payment transaction represents a transfer of value from one account to another. This is the only transaction type that can create new accounts by sending enough XRP to an unfunded address.

## Important Notes:
- Payment is the only transaction type that can create accounts
- Cross-currency payments may involve multiple exchanges atomically
- Partial payments can exploit integrations that assume exact delivery amounts
- Paths field is auto-fillable by the server for cross-currency payments
- Quality limits help avoid unfavorable exchange rates
- Deposit authorization requires preauthorized credentials
- MPT payments only support direct transfers, not DEX trading`,
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
