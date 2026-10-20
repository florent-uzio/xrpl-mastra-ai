import { PermissionedDomainSet } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplPermissionedDomainSetSchema } from './permissioned-domain-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplPermissionedDomainSetSchema,
})

export const submitPermissionedDomainSetTool = createTransactionTool<PermissionedDomainSet>({
  toolId: 'submit-permissioned-domain-set',
  description: `Submit a PermissionedDomainSet transaction to create or update a permissioned domain. Requires the PermissionedDomains amendment (which also needs Credentials).

Fields: AcceptedCredentials (1-10 unique entries of {Credential: {Issuer, CredentialType (hex, 1-64 bytes)}}), and optional DomainID (64-char hex) to update an existing domain you own; omit it to create a new one. Updating replaces the whole credential list. The domain ID of a new domain is the ledger index of the created PermissionedDomain object. Common errors: temMALFORMED (duplicate/too many credentials), tecNO_ENTRY (domain not found), tecNO_ISSUER (an issuer does not exist), tecINSUFFICIENT_RESERVE.`,
  buildTransaction: permissionedDomainSet => {
    return permissionedDomainSet as PermissionedDomainSet
  },
})
