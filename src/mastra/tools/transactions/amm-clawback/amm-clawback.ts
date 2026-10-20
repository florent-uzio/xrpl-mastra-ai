import { AMMClawback } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplAmmClawbackSchema } from './amm-clawback.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplAmmClawbackSchema,
})

export const submitAmmClawbackTool = createTransactionTool<AMMClawback>({
  toolId: 'submit-amm-clawback',
  description: `Submit an AMMClawback transaction. A token issuer claws back its own token from a Holder's share of an AMM pool (the Holder's LP tokens are redeemed and the issuer's token is returned to the issuer). Requires the AMMClawback amendment.

Fields:
- Holder: account whose AMM position is clawed back.
- Asset: {currency, issuer} of the token to claw back. The issuer must be the sender (Account) and must have enabled Allow Trust Line Clawback (set before any trust line existed).
- Asset2: the other asset of the AMM (XRP as {currency: "XRP"}, or {currency, issuer}).
- Amount (optional): max amount of Asset to claw back, {currency, issuer, value}. Omit to claw back everything the Holder has in the pool.
- Flags (optional): 1 (tfClawTwoAssets) also claws back the equal value of Asset2; only if the sender also issues Asset2. Otherwise the Holder keeps the Asset2 share.

Errors: terNO_AMM, tecNO_PERMISSION (clawback not enabled or issuer mismatch), tecAMM_BALANCE (holder has no balance), temMALFORMED, tecINTERNAL.`,
  buildTransaction: ammClawback => {
    const { Amount, ...rest } = ammClawback

    return {
      ...rest,
      Asset: encodeCurrencyCodes(ammClawback.Asset),
      Asset2: encodeCurrencyCodes(ammClawback.Asset2),
      ...(Amount ? { Amount: encodeCurrencyCodes(Amount) } : {}),
    }
  },
})
