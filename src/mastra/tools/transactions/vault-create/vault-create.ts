import { VaultCreate } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplVaultCreateSchema } from './vault-create.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplVaultCreateSchema,
})

export const submitVaultCreateTool = createTransactionTool<VaultCreate>({
  toolId: 'submit-vault-create',
  description: `Submit a VaultCreate transaction to create a single-asset vault. Depositors receive shares (an MPT) for their deposits. Requires the SingleAssetVault amendment.

Asset is XRP ({currency: "XRP"}), a token ({currency, issuer}) or an MPT ({mpt_issuance_id}). Token issuers need DefaultRipple enabled. The response contains the new Vault ID. Creation burns an owner reserve (about 0.2 XRP) instead of the normal fee.

Flags (set at creation only):
- tfVaultPrivate (65536): only accounts with credentials in DomainID can deposit
- tfVaultShareNonTransferable (131072): shares cannot be transferred

VaultKind 0 is open-ended. VaultKind 1 is closed-ended and requires SubscriptionDate and RedemptionDate. Both cannot be changed later. Scale only applies to token assets.

Errors: tecNO_AUTH or tecLOCKED (MPT cannot be transferred or is locked), tecFROZEN, tecINSUFFICIENT_RESERVE, tecWRONG_ASSET, terNO_RIPPLE.`,
  buildTransaction: vaultCreate => {
    return { ...vaultCreate, Asset: encodeCurrencyCodes(vaultCreate.Asset) }
  },
})
