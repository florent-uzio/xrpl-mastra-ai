import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplVaultDepositSchema } from './vault-deposit.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplVaultDepositSchema,
})

export const submitVaultDepositTool = createTransactionTool({
  toolId: 'submit-vault-deposit',
  description: `Submit a VaultDeposit transaction to deposit assets into a vault in exchange for shares. Requires the SingleAssetVault amendment.

Amount is XRP in drops, or {currency, issuer, value} for a token, or {mpt_issuance_id, value} for an MPT. It must be the vault's asset. The amount is rounded down to the vault's precision. No transfer fee applies.

Private vaults require the depositor to hold valid credentials in the vault's permissioned domain. Closed-ended vaults only accept deposits during the subscription phase.

Errors: tecWRONG_ASSET, tecINSUFFICIENT_FUNDS, tecLIMIT_EXCEEDED (above AssetsMaximum), tecNO_AUTH (private vault without credentials), tecFROZEN, tecLOCKED, tecEXPIRED (closed-ended vault past subscription), tecPRECISION_LOSS, tecNO_ENTRY.`,
  buildTransaction: vaultDeposit => {
    return { ...vaultDeposit, Amount: encodeCurrencyCodes(vaultDeposit.Amount) }
  },
})
