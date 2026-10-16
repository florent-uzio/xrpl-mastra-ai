import { useTransactionToolFactory } from '../factory'
import { xrplVaultSetSchema } from './vault-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplVaultSetSchema,
})

export const submitVaultSetTool = createTransactionTool({
  toolId: 'submit-vault-set',
  description: `Submit a VaultSet transaction to update a vault. Only the vault owner can send it. Requires the SingleAssetVault amendment.

You can change Data, AssetsMaximum and DomainID. Whether the vault is public or private cannot be changed. DomainID only applies to private vaults.

Errors: tecNO_ENTRY (vault not found), tecNO_PERMISSION (not the owner, or DomainID on a public vault), tecLIMIT_EXCEEDED (AssetsMaximum below AssetsTotal), tecOBJECT_NOT_FOUND (DomainID not found).`,
  buildTransaction: vaultSet => {
    return vaultSet
  },
})
