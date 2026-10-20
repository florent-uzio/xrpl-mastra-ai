import { DepositPreauth } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplDepositPreauthSchema } from './deposit-preauth.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplDepositPreauthSchema,
})

export const submitDepositPreauthTool = createTransactionTool<DepositPreauth>({
  toolId: 'submit-deposit-preauth',
  description: `Submit a DepositPreauth transaction to preauthorize (or remove the preauthorization of) an account or a set of credentials to send payments to the sender, which matters when the sender uses Deposit Authorization (asfDepositAuth).

Provide exactly one of: Authorize (r-address to preauthorize), Unauthorize (r-address to remove), AuthorizeCredentials (1-8 { Credential: { Issuer, CredentialType (hex, 1-64 bytes) } } to preauthorize), UnauthorizeCredentials (same shape, to remove).

Each preauthorization requires an owner reserve. Common errors: temMALFORMED (not exactly one field set, or duplicates), temCANNOT_PREAUTH_SELF, tecDUPLICATE (already preauthorized), tecNO_ENTRY (nothing to remove), tecNO_TARGET (account does not exist), tecNO_ISSUER, tecINSUFFICIENT_RESERVE.`,
  buildTransaction: params => {
    return params
  },
})
