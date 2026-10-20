import { DIDSet } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplDIDSetSchema } from './did-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplDIDSetSchema,
})

export const submitDIDSetTool = createTransactionTool<DIDSet>({
  toolId: 'submit-did-set',
  description: `Submit a DIDSet transaction to create or update the DID (decentralized identifier) ledger entry of Account. Requires the DID amendment. Each account has at most one DID.

Fields (all hex, max 256 bytes each): Data, DIDDocument, URI. At least one must be provided. When updating, omitted fields are left unchanged; an empty string clears a field, but the DID cannot end up with all three fields empty. Common errors: tecEMPTY_DID (all fields empty), tecINSUFFICIENT_RESERVE.`,
  buildTransaction: didSet => {
    return didSet as DIDSet
  },
  validateTransaction: ({ Data, DIDDocument, URI }) => {
    if (Data === undefined && DIDDocument === undefined && URI === undefined) {
      throw new Error('At least one of Data, DIDDocument or URI must be provided')
    }
  },
})
