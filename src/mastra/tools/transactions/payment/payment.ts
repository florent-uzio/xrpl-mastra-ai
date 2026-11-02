import { Payment } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplPaymentSchema } from './payment.types'

const { createTransactionTool } = useTransactionToolFactory({ inputSchema: xrplPaymentSchema })

export const submitPaymentTool = createTransactionTool<Payment>({
  toolId: 'submit-payment',
  description: `Submit a Payment transaction to send XRP, tokens or MPTs. Sending enough XRP to an unfunded address creates the account.

- Provide Amount (API v1) or DeliverMax (API v2).
- XRP amounts are strings in drops. Token amounts are objects {currency, issuer, value}. Currency codes are converted to hex automatically.
- Cross-currency payments need SendMax. Paths are filled in by the server if omitted.
- tfPartialPayment can deliver less than Amount. Check the delivered amount in the result.
- MPT payments are direct transfers only, not DEX trades.`,
  buildTransaction: payment => {
    // DeliverMax (API v2) replaces Amount (API v1): never send both
    return { ...payment, Amount: payment.DeliverMax ? undefined : payment.Amount } as Payment
  },
  validateTransaction: params => {
    if (params.Amount === undefined && params.DeliverMax === undefined) {
      throw new Error('Provide Amount (API v1) or DeliverMax (API v2)')
    }
  },
})
