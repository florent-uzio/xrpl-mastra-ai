import { ConfidentialMPTSend } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplConfidentialMPTSendSchema } from './confidential-mpt-send.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplConfidentialMPTSendSchema,
})

export const submitConfidentialMPTSendTool = createTransactionTool<ConfidentialMPTSend>({
  toolId: 'submit-confidential-mpt-send',
  description: `Submit a ConfidentialMPTSend transaction: send MPT confidentially (amount hidden) between holders; the receiver gets it in their inbox. Neither party may be the issuer. Needs ConfidentialTransfer and CanTransfer. ZK proofs and ciphertexts must be generated client-side by the holder/issuer wallet; they cannot be made by this tool.

Errors: tecBAD_PROOF (stale ConfidentialBalanceVersion), tecBAD_CREDENTIALS, tecEXPIRED, tecDST_TAG_NEEDED, tecLOCKED, tecNO_AUTH, tecNO_PERMISSION, tecNO_TARGET, tecOBJECT_NOT_FOUND, temBAD_CIPHERTEXT, temMALFORMED.`,
  buildTransaction: params => params as ConfidentialMPTSend,
})
