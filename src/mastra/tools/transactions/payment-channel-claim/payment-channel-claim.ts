import { PaymentChannelClaim } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplPaymentChannelClaimSchema } from './payment-channel-claim.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplPaymentChannelClaimSchema,
})

export const submitPaymentChannelClaimTool = createTransactionTool<PaymentChannelClaim>({
  toolId: 'submit-payment-channel-claim',
  description: `Submit a PaymentChannelClaim transaction to claim XRP from a payment channel, renew its expiration, or request its closure.

Channel is the 64-hex channel ID. Balance is the cumulative total XRP in drops delivered after this claim, and Amount is the total authorized by the Signature (drops).

Who can do what: the destination claims funds by sending Balance, Amount, Signature and PublicKey (PublicKey must match the channel's). The source can claim up to the channel Amount by sending only Balance, with no Signature or PublicKey.

Flags: tfRenew (65536) clears the channel Expiration, source only. tfClose (131072) requests closure: the destination closes it right away, the source starts the SettleDelay countdown (or closes immediately if the channel has no XRP left). Pass Flags as a number (65536, 131072, or leave unset).

Common errors: tecNO_ENTRY (channel not found), tecNO_PERMISSION (wrong sender or PublicKey mismatch), temBAD_SIGNATURE, tecUNFUNDED_PAYMENT (Balance above channel Amount), temBAD_AMOUNT.`,
  buildTransaction: params => {
    return params
  },
})
