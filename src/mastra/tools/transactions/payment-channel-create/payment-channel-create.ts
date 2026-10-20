import { PaymentChannelCreate } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplPaymentChannelCreateSchema } from './payment-channel-create.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplPaymentChannelCreateSchema,
})

export const submitPaymentChannelCreateTool = createTransactionTool<PaymentChannelCreate>({
  toolId: 'submit-payment-channel-create',
  description: `Submit a PaymentChannelCreate transaction to open a unidirectional XRP payment channel to a destination.

Amount is the XRP in drops locked in the channel (deducted immediately). Destination is the receiver. SettleDelay is the seconds the source must wait before closing a channel that still holds unclaimed XRP. PublicKey is the hex public key (66 chars) used to sign off-ledger claims. CancelAfter is optional and expressed in seconds since the Ripple Epoch (immutable). DestinationTag is an optional 32-bit tag.

The channel ID is returned in the created PayChannel ledger object. Use PaymentChannelFund to add XRP and PaymentChannelClaim to claim.

Common errors: tecUNFUNDED (not enough XRP above the reserve), tecNO_DST (destination does not exist), tecDST_TAG_NEEDED, tecNO_PERMISSION (destination disallows incoming payment channels or requires deposit auth), temDST_IS_SRC, temBAD_EXPIRATION.`,
  buildTransaction: params => {
    return params
  },
})
