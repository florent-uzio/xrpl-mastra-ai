import { VaultWithdraw } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplVaultWithdrawSchema } from './vault-withdraw.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplVaultWithdrawSchema,
})

export const submitVaultWithdrawTool = createTransactionTool<VaultWithdraw>({
  toolId: 'submit-vault-withdraw',
  description: `Submit a VaultWithdraw transaction to redeem vault shares for assets. Requires the SingleAssetVault and LendingProtocolV1_1 amendments.

Amount is either the vault's asset (the shares needed are burned) or a share amount (shares are converted to assets). Unrealized losses mean more shares are burned or fewer assets are received. Payouts never exceed the requested amount. No transfer fee applies.

Destination defaults to the sender. It must be able to hold the asset. On a private vault, withdrawing to another account requires valid credentials for both accounts. Closed-ended vaults cannot be withdrawn from during the investment phase.

Errors: tecINSUFFICIENT_FUNDS (not enough shares or available assets), tecWRONG_ASSET, tecTOO_SOON (closed-ended vault still invested), tecNO_LINE, tecNO_AUTH, tecFROZEN, tecLOCKED, tecEXPIRED, tecPRECISION_LOSS, tecNO_ENTRY.`,
  buildTransaction: vaultWithdraw => {
    return { ...vaultWithdraw, Amount: encodeCurrencyCodes(vaultWithdraw.Amount) }
  },
})
