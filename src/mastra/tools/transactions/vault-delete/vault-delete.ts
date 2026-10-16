import { useTransactionToolFactory } from '../factory'
import { xrplVaultDeleteSchema } from './vault-delete.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplVaultDeleteSchema,
})

export const submitVaultDeleteTool = createTransactionTool({
  toolId: 'submit-vault-delete',
  description: `Submit a VaultDelete transaction to permanently delete a vault and free the owner's reserve. Only the vault owner can send it, and the vault must be empty: no assets and no outstanding shares. Requires the SingleAssetVault amendment.

If shares remain after the assets are gone, the owner can burn them with VaultClawback first.

Errors: tecHAS_OBLIGATIONS (vault still holds assets or shares), tecNO_PERMISSION (not the owner), tecNO_ENTRY.`,
  buildTransaction: vaultDelete => {
    return vaultDelete
  },
})
