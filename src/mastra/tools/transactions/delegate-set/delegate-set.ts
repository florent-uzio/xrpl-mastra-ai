import { DelegateSet } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplDelegateSetSchema } from './delegate-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplDelegateSetSchema,
})

export const submitDelegateSetTool = createTransactionTool<DelegateSet>({
  toolId: 'submit-delegate-set',
  description: `Submit a DelegateSet transaction to grant (or revoke) permissions for another account to send transactions on behalf of Account. Requires the PermissionDelegation amendment.

Fields: Authorize (the delegate account, not Account itself) and Permissions (up to 10 entries of {Permission: {PermissionValue}}). PermissionValue is a granular permission (TrustlineAuthorize, TrustlineFreeze, TrustlineUnfreeze, AccountDomainSet, AccountEmailHashSet, AccountMessageKeySet, AccountTransferRateSet, AccountTickSizeSet, PaymentMint, PaymentBurn, MPTokenIssuanceLock, MPTokenIssuanceUnlock) or a delegable transaction type name such as Payment. AccountSet, SetRegularKey, SignerListSet, DelegateSet and AccountDelete cannot be delegated. The new list replaces the old one; an empty Permissions array removes the delegation. The delegate later submits transactions with the Delegate common field set to its own address. Common errors: temMALFORMED, tecNO_TARGET (delegate account does not exist), tecINSUFFICIENT_RESERVE.`,
  buildTransaction: delegateSet => {
    return delegateSet as DelegateSet
  },
})
