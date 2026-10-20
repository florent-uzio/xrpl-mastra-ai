import { AMMWithdraw } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplAmmWithdrawSchema } from './amm-withdraw.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplAmmWithdrawSchema,
})

export const submitAmmWithdrawTool = createTransactionTool<AMMWithdraw>({
  toolId: 'submit-amm-withdraw',
  description: `Submit an AMMWithdraw transaction to redeem LP tokens for assets from an AMM pool.

Fields:
- Asset and Asset2: the two assets of the AMM (XRP as {currency: "XRP"}, or {currency, issuer}).
- Amount, Amount2, EPrice, LPTokenIn: which are required depends on the Flags mode (XRP in drops as a string, tokens as {currency, issuer, value}; LPTokenIn uses the AMM's LP token currency and issuer from amm_info).

Flags (exactly one):
- 65536 tfLPToken: LPTokenIn only, withdraws both assets proportionally.
- 131072 tfWithdrawAll: no other fields, redeems all your LP tokens for both assets.
- 262144 tfOneAssetWithdrawAll: Amount (asset to receive), redeems all your LP tokens for that one asset.
- 524288 tfSingleAsset: Amount only, withdraws one asset.
- 1048576 tfTwoAsset: Amount and Amount2, withdraws both (limited by the pool ratio).
- 2097152 tfOneAssetLPToken: Amount and LPTokenIn, one asset for an exact LP token amount.
- 4194304 tfLimitLPToken: Amount and EPrice, one asset with a minimum price per LP token.

Single-asset withdrawals pay the AMM's trading fee. Withdrawing all LP tokens deletes the AMM if it becomes empty (see AMMDelete if it cannot be fully deleted).

Errors: terNO_AMM, tecAMM_FAILED (withdrawal outside the limits), tecAMM_BALANCE, tecAMM_INVALID_TOKENS, tecFROZEN, tecNO_AUTH, tecINSUF_RESERVE_LINE, tecINCOMPLETE.`,
  buildTransaction: ammWithdraw => {
    const { Amount, Amount2, EPrice, ...rest } = ammWithdraw

    return {
      ...rest,
      Asset: encodeCurrencyCodes(ammWithdraw.Asset),
      Asset2: encodeCurrencyCodes(ammWithdraw.Asset2),
      ...(Amount !== undefined ? { Amount: encodeCurrencyCodes(Amount) } : {}),
      ...(Amount2 !== undefined ? { Amount2: encodeCurrencyCodes(Amount2) } : {}),
      ...(EPrice !== undefined ? { EPrice: encodeCurrencyCodes(EPrice) } : {}),
    }
  },
})
