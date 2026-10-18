import { MPTokenIssuanceDestroy } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplMPTokenIssuanceDestroySchema } from './mptoken-issuance-destroy.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplMPTokenIssuanceDestroySchema,
})

export const submitMPTokenIssuanceDestroyTool = createTransactionTool<MPTokenIssuanceDestroy>({
  toolId: 'submit-mptoken-issuance-destroy',
  description: `Submit an MPTokenIssuanceDestroy transaction to delete an MPT issuance. Only the issuer can send it, and only when no holder has any of the MPT (holders must first delete their empty MPToken with MPTokenAuthorize flag 1).`,
  buildTransaction: params => params as MPTokenIssuanceDestroy,
})
