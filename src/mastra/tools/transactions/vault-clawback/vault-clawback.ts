import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplVaultClawbackSchema } from './vault-clawback.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplVaultClawbackSchema,
})

export const submitVaultClawbackTool = createTransactionTool({
  toolId: 'submit-vault-clawback',
  description: `Submit a VaultClawback transaction to claw back assets or shares from a vault holder. It performs a VaultWithdraw on the holder's behalf. Requires the SingleAssetVault amendment. XRP cannot be clawed back.

Who can claw back what:
- Asset: only the asset's issuer. The token must allow clawback (asfAllowTrustLineClawback, no NoFreeze) or the MPT must have Can Clawback. The issuer cannot be the Holder.
- Shares: only the vault owner, and only to wind down a vault whose AssetsTotal and AssetsAvailable are 0 while shares remain. Amount must be the holder's entire share balance (or 0). This lets VaultDelete proceed.

Amount 0 claws back everything. If it exceeds AssetsAvailable, only that is recovered. Unrealized losses and rounding apply.

Errors: tecNO_PERMISSION, tecWRONG_ASSET (also when Amount is omitted and the owner is the issuer), tecINSUFFICIENT_FUNDS (holder has no shares), tecLIMIT_EXCEEDED, tecPRECISION_LOSS, tecPSEUDO_ACCOUNT, tecNO_ENTRY.`,
  buildTransaction: vaultClawback => {
    const { Amount, ...rest } = vaultClawback
    return Amount === undefined ? rest : { ...rest, Amount: encodeCurrencyCodes(Amount) }
  },
})
