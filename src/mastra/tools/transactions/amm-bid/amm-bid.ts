import { AMMBid } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplAmmBidSchema } from './amm-bid.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplAmmBidSchema,
})

export const submitAmmBidTool = createTransactionTool<AMMBid>({
  toolId: 'submit-amm-bid',
  description: `Submit an AMMBid transaction to bid on an AMM's auction slot. The slot holder trades against the AMM at a discounted fee for 24 hours.

Fields:
- Asset and Asset2: the two assets of the AMM (XRP as {currency: "XRP"}, or {currency, issuer}).
- BidMin / BidMax (optional): min and max amount of the AMM's LP tokens to pay (LP token currency and issuer come from amm_info). The bid must exceed the current slot price; the minimum price is set by the AMM's trading fee. If omitted, the minimum slot price is paid. Paid LP tokens are burned, except a refund to the previous slot holder.
- AuthAccounts (optional): up to 4 other accounts that also get the discounted fee, as [{AuthAccount: {Account}}].

Rules: the sender must hold LP tokens of the AMM and must hold at least the bid amount.

Errors: tecAMM_FAILED_BID (bid below price or outside BidMin/BidMax), tecAMM_INVALID_TOKENS, terNO_AMM, tecINSUFFICIENT_FUNDS, temBAD_AMM_TOKENS.`,
  buildTransaction: ammBid => {
    return {
      ...ammBid,
      Asset: encodeCurrencyCodes(ammBid.Asset),
      Asset2: encodeCurrencyCodes(ammBid.Asset2),
    }
  },
})
