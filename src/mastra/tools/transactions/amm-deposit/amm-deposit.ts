import { AMMDeposit } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplAmmDepositSchema } from './amm-deposit.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplAmmDepositSchema,
})

export const submitAmmDepositTool = createTransactionTool<AMMDeposit>({
  toolId: 'submit-amm-deposit',
  description: `Submit an AMMDeposit transaction to add assets to an AMM pool and receive LP tokens.

Fields:
- Asset and Asset2: the two assets of the AMM (XRP as {currency: "XRP"}, or {currency, issuer}).
- Amount, Amount2, EPrice, LPTokenOut: which are required depends on the Flags mode (XRP in drops as a string, tokens as {currency, issuer, value}; LPTokenOut uses the AMM's LP token currency and issuer from amm_info).

Flags (exactly one):
- 65536 tfLPToken: LPTokenOut only, deposits both assets proportionally.
- 524288 tfSingleAsset: Amount only, deposits one asset.
- 1048576 tfTwoAsset: Amount and Amount2, deposits both (limited by the pool ratio).
- 2097152 tfOneAssetLPToken: Amount and LPTokenOut, one asset for an exact LP token amount.
- 4194304 tfLimitLPToken: Amount and EPrice, one asset with a maximum price per LP token.
- 8388608 tfTwoAssetIfEmpty: Amount and Amount2 (+ optional TradingFee), only when the AMM pool is empty.

Single-asset deposits pay the AMM's trading fee. Depositing may add a trust line for the LP tokens (reserve).

Errors: terNO_AMM, tecAMM_FAILED (deposit would be below the limits), tecUNFUNDED_AMM, tecAMM_EMPTY, tecAMM_NOT_EMPTY, tecFROZEN, tecNO_AUTH, tecINSUF_RESERVE_LINE, temBAD_AMM_TOKENS.`,
  buildTransaction: ammDeposit => {
    const { Amount, Amount2, EPrice, ...rest } = ammDeposit

    return {
      ...rest,
      Asset: encodeCurrencyCodes(ammDeposit.Asset),
      Asset2: encodeCurrencyCodes(ammDeposit.Asset2),
      ...(Amount !== undefined ? { Amount: encodeCurrencyCodes(Amount) } : {}),
      ...(Amount2 !== undefined ? { Amount2: encodeCurrencyCodes(Amount2) } : {}),
      ...(EPrice !== undefined ? { EPrice: encodeCurrencyCodes(EPrice) } : {}),
    }
  },
})
