import { AccountDelete } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplAccountDeleteSchema } from './account-delete.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplAccountDeleteSchema,
})

export const submitAccountDeleteTool = createTransactionTool<AccountDelete>({
  toolId: 'submit-account-delete',
  description: `Submit an AccountDelete transaction to permanently delete the sender account and send its remaining XRP to Destination.

WARNING: this is irreversible and destroys the account. It cannot be undone, although the address can be re-funded later as a new account.

Requirements: the account Sequence number plus 256 must be below the current ledger index (the account must be at least 256 ledgers old by sequence); it cannot own ledger objects that block deletion (for example escrows, payment channels, pending checks to be resolved, an issuer with trust lines held by others, NFT pages, AMM or vault objects) and cannot hold more than 1000 deletable objects; the fee is the owner reserve (about 2 XRP, not the normal fee), which is burned. Destination must exist; DestinationTag is required if the destination has RequireDest; use CredentialIDs if it requires Deposit Authorization.

Common errors: tecTOO_SOON (fewer than 256 ledgers), tecHAS_OBLIGATIONS (account owns blocking objects), tecNO_DST, tecDST_TAG_NEEDED, tecNO_PERMISSION, tecINSUFFICIENT_FEE, temDST_IS_SRC.`,
  buildTransaction: params => {
    return params
  },
})
