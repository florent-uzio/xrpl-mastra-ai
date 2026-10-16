import { ConfidentialMPTConvert } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplConfidentialMPTConvertSchema } from './confidential-mpt-convert.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplConfidentialMPTConvertSchema,
})

export const submitConfidentialMPTConvertTool = createTransactionTool({
  toolId: 'submit-confidential-mpt-convert',
  description: `Submit a ConfidentialMPTConvert transaction: convert a holder's public MPT balance into a confidential balance (credited to the inbox). Holder only, not the issuer. Needs the ConfidentialTransfer amendment and an issuance with CanHoldConfidentialBalance. ZK proofs and ciphertexts must be generated client-side by the holder/issuer wallet; they cannot be made by this tool.

Errors: tecBAD_PROOF, tecDUPLICATE (key already registered), tecINSUFFICIENT_FUNDS, tecLOCKED, tecNO_AUTH, tecNO_PERMISSION (no CanHoldConfidentialBalance or auditor mismatch), tecOBJECT_NOT_FOUND, temBAD_CIPHERTEXT, temMALFORMED.`,
  buildTransaction: params => params as ConfidentialMPTConvert,
})
