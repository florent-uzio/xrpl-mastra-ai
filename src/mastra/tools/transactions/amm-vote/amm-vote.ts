import { AMMVote } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplAmmVoteSchema } from './amm-vote.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplAmmVoteSchema,
})

export const submitAmmVoteTool = createTransactionTool<AMMVote>({
  toolId: 'submit-amm-vote',
  description: `Submit an AMMVote transaction to vote on an AMM's trading fee. Votes are weighted by the amount of the AMM's LP tokens the sender holds, and the AMM's fee becomes the weighted average of the votes.

Fields:
- Asset and Asset2: the two assets of the AMM (XRP as {currency: "XRP"}, or {currency, issuer}).
- TradingFee: 0-1000, in units of 0.001% (1000 = 1%).

Rules: the sender must hold LP tokens of the AMM. Up to 8 votes are kept; a new voter with more LP tokens than the smallest existing vote replaces it.

Errors: terNO_AMM, tecAMM_INVALID_TOKENS (sender holds no LP tokens), tecAMM_FAILED_VOTE (vote not recorded, too small), temBAD_FEE.`,
  buildTransaction: ammVote => {
    return {
      ...ammVote,
      Asset: encodeCurrencyCodes(ammVote.Asset),
      Asset2: encodeCurrencyCodes(ammVote.Asset2),
    }
  },
})
