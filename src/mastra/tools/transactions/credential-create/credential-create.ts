import { CredentialCreate } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplCredentialCreateSchema } from './credential-create.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplCredentialCreateSchema,
})

export const submitCredentialCreateTool = createTransactionTool<CredentialCreate>({
  toolId: 'submit-credential-create',
  description: `Submit a CredentialCreate transaction to issue a credential (Account is the issuer) to a Subject account. Requires the Credentials amendment. The credential is pending until the Subject accepts it with CredentialAccept (unless Subject is the issuer, in which case it is accepted automatically).

Fields: Subject (r-address), CredentialType (hex, 1-64 bytes), Expiration (optional, seconds since the Ripple Epoch), URI (optional, hex, max 256 bytes). The issuer owns the reserve for the credential until it is accepted. Common errors: tecDUPLICATE (credential already exists), tecEXPIRED (Expiration in the past), tecNO_TARGET (Subject does not exist).`,
  buildTransaction: credentialCreate => {
    return credentialCreate as CredentialCreate
  },
})
