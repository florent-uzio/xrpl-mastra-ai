import { CredentialAccept } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplCredentialAcceptSchema } from './credential-accept.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplCredentialAcceptSchema,
})

export const submitCredentialAcceptTool = createTransactionTool<CredentialAccept>({
  toolId: 'submit-credential-accept',
  description: `Submit a CredentialAccept transaction to accept a credential issued to you. Requires the Credentials amendment. Account must be the credential's Subject; the credential only becomes valid once accepted.

Fields: Issuer (account that issued the credential) and CredentialType (hex, 1-64 bytes), which must match a pending credential created by CredentialCreate. Common errors: tecNO_ENTRY (no such credential), tecDUPLICATE (already accepted), tecEXPIRED (credential expired).`,
  buildTransaction: credentialAccept => {
    return credentialAccept as CredentialAccept
  },
})
