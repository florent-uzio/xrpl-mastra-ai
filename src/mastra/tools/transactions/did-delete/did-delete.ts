import { DIDDelete } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplDIDDeleteSchema } from './did-delete.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplDIDDeleteSchema,
})

export const submitDIDDeleteTool = createTransactionTool<DIDDelete>({
  toolId: 'submit-did-delete',
  description: `Submit a DIDDelete transaction to delete the DID ledger entry of Account. Requires the DID amendment. No fields besides the common ones. Common error: tecNO_ENTRY (the account has no DID).`,
  buildTransaction: didDelete => {
    return didDelete as DIDDelete
  },
})
