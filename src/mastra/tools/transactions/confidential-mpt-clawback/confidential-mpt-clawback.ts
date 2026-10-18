import { ConfidentialMPTClawback } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplConfidentialMPTClawbackSchema } from './confidential-mpt-clawback.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplConfidentialMPTClawbackSchema,
})

export const submitConfidentialMPTClawbackTool = createTransactionTool<ConfidentialMPTClawback>({
  toolId: 'submit-confidential-mpt-clawback',
  description: `Submit a ConfidentialMPTClawback transaction: the issuer claws back a holder's whole confidential balance (inbox and spending) by revealing the plaintext amount with a proof. Needs ConfidentialTransfer, CanClawback and CanHoldConfidentialBalance; the holder must be registered. Lock the holder first so the balance doesn't change. ZK proofs and ciphertexts must be generated client-side by the holder/issuer wallet; they cannot be made by this tool.

Errors: tecBAD_PROOF (wrong amount), tecINSUFFICIENT_FUNDS, tecNO_PERMISSION, tecNO_TARGET, tecOBJECT_NOT_FOUND, temBAD_AMOUNT, temMALFORMED (sender not issuer, or Holder is the issuer).`,
  buildTransaction: params => params as ConfidentialMPTClawback,
})
