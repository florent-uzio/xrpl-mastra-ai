import { ConfidentialMPTConvert } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplConfidentialMPTConvertSchema } from './confidential-mpt-convert.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplConfidentialMPTConvertSchema,
})

export const submitConfidentialMPTConvertTool = createTransactionTool<ConfidentialMPTConvert>({
  toolId: 'submit-confidential-mpt-convert',
  description: `Submit a ConfidentialMPTConvert transaction: convert a holder's public MPT balance into a confidential balance (credited to the inbox). Holder only, not the issuer. Needs the ConfidentialTransfer amendment and an issuance with CanHoldConfidentialBalance. This tool cannot make the ciphertexts or proofs: get them (BlindingFactor, encrypted amounts, HolderEncryptionKey, ZKProof, Sequence) from prepare-confidential-convert and pass the transaction unchanged.

Errors: tecBAD_PROOF, tecDUPLICATE (key already registered), tecINSUFFICIENT_FUNDS, tecLOCKED, tecNO_AUTH, tecNO_PERMISSION (no CanHoldConfidentialBalance or auditor mismatch), tecOBJECT_NOT_FOUND, temBAD_CIPHERTEXT, temMALFORMED.`,
  buildTransaction: params => params as ConfidentialMPTConvert,
})
