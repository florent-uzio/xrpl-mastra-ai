import { CredentialDelete } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplCredentialDeleteSchema } from './credential-delete.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplCredentialDeleteSchema,
})

export const submitCredentialDeleteTool = createTransactionTool<CredentialDelete>({
  toolId: 'submit-credential-delete',
  description: `Submit a CredentialDelete transaction to delete a credential from the ledger. Requires the Credentials amendment. The Subject or the Issuer can delete a credential at any time; anyone can delete it once it has expired.

Fields: CredentialType (hex, 1-64 bytes) plus Subject and/or Issuer. At least one of Subject or Issuer is required; an omitted one defaults to Account. Common errors: tecNO_ENTRY (credential not found), tecNO_PERMISSION (not subject/issuer and credential not expired).`,
  buildTransaction: credentialDelete => {
    return credentialDelete as CredentialDelete
  },
  validateTransaction: ({ Subject, Issuer }) => {
    if (!Subject && !Issuer) {
      throw new Error('At least one of Subject or Issuer must be provided')
    }
  },
})
