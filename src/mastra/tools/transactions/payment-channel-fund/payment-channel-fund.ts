import { PaymentChannelFund } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplPaymentChannelFundSchema } from './payment-channel-fund.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplPaymentChannelFundSchema,
})

export const submitPaymentChannelFundTool = createTransactionTool<PaymentChannelFund>({
  toolId: 'submit-payment-channel-fund',
  description: `Submit a PaymentChannelFund transaction to add XRP to an existing payment channel you created, and optionally update its expiration.

Channel is the 64-hex channel ID. Amount is the XRP in drops to add (deducted from your balance). Expiration is optional, in seconds since the Ripple Epoch. Only the channel source can fund it.

Common errors: tecNO_ENTRY (channel not found), tecNO_PERMISSION (sender is not the channel source), tecUNFUNDED, temBAD_AMOUNT, temBAD_EXPIRATION.`,
  buildTransaction: params => {
    return params
  },
})
