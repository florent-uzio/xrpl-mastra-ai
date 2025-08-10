import { Payment } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplPaymentSchema } from './payment.types'

const { createTransactionTool } = useTransactionToolFactory(xrplPaymentSchema)

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
      Amount: payment.Amount ?? payment.DeliverMax,
    }

    return builtPayment
  },
  validateTransaction: params => {
    if (params.Amount === undefined && params.DeliverMax === undefined) {
      throw new Error('Provide Amount (API v1) or DeliverMax (API v2)')
    }
  },
})
