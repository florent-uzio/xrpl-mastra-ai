import { ConfidentialMPTConvertBack } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplConfidentialMPTConvertBackSchema } from './confidential-mpt-convert-back.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplConfidentialMPTConvertBackSchema,
})

export const submitConfidentialMPTConvertBackTool = createTransactionTool<ConfidentialMPTConvertBack>({
  toolId: 'submit-confidential-mpt-convert-back',
  description: `Submit a ConfidentialMPTConvertBack transaction: convert part of a holder's confidential spending balance back to a public balance. Holder only, not the issuer. Needs ConfidentialTransfer. ZK proofs and ciphertexts must be generated client-side by the holder/issuer wallet; they cannot be made by this tool.

Errors: tecBAD_PROOF (also if spending balance < MPTAmount), tecINSUFFICIENT_FUNDS, tecLOCKED, tecNO_AUTH, tecNO_PERMISSION, tecOBJECT_NOT_FOUND, temBAD_AMOUNT, temBAD_CIPHERTEXT, temMALFORMED.`,
  buildTransaction: params => params as ConfidentialMPTConvertBack,
})
