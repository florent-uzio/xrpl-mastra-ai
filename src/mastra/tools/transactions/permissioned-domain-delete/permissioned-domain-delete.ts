import { PermissionedDomainDelete } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplPermissionedDomainDeleteSchema } from './permissioned-domain-delete.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplPermissionedDomainDeleteSchema,
})

export const submitPermissionedDomainDeleteTool = createTransactionTool<PermissionedDomainDelete>({
  toolId: 'submit-permissioned-domain-delete',
  description: `Submit a PermissionedDomainDelete transaction to delete a permissioned domain you own. Requires the PermissionedDomains amendment. DomainID is the 64-char hex ID of the domain. Common errors: tecNO_ENTRY (domain not found), tecNO_PERMISSION (Account is not the owner).`,
  buildTransaction: permissionedDomainDelete => {
    return permissionedDomainDelete as PermissionedDomainDelete
  },
})
