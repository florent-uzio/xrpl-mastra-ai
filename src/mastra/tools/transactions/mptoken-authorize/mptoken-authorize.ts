import { MPTokenAuthorize } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplMPTokenAuthorizeSchema } from './mptoken-authorize.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplMPTokenAuthorizeSchema,
})

export const submitMPTokenAuthorizeTool = createTransactionTool<MPTokenAuthorize>({
  toolId: 'submit-mptoken-authorize',
  description: `Submit an MPTokenAuthorize transaction. Used in two ways:
- Holder opt-in: the holder sends it with MPTokenIssuanceID only. Required before the holder can receive the MPT. Also adds to the holder's reserve.
- Issuer authorization: when the issuance has tfMPTRequireAuth, the issuer sends it with Holder set to approve that holder. The holder must have opted in first.

Flags: 1 (tfMPTUnauthorize) reverses the action. A holder uses it to delete their empty MPToken (balance must be 0). An issuer uses it to revoke a holder's authorization.

Errors: tecNO_PERMISSION means the sender is not allowed (e.g. the issuer sent it without Holder, or Holder was set by a non-issuer). tecNO_ENTRY means the holder has not opted in yet.`,
  buildTransaction: params => params as MPTokenAuthorize,
})
