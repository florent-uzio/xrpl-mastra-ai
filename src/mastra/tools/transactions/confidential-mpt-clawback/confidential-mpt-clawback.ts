import { ConfidentialMPTClawback } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplConfidentialMPTClawbackSchema } from './confidential-mpt-clawback.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplConfidentialMPTClawbackSchema,
})

export const submitConfidentialMPTClawbackTool = createTransactionTool<ConfidentialMPTClawback>({
  toolId: 'submit-confidential-mpt-clawback',
  description: `Submit a ConfidentialMPTClawback transaction: the issuer claws back a holder's whole confidential balance (inbox and spending) by revealing the plaintext amount with a proof. This is all-or-nothing: MPTAmount must equal the holder's whole confidential balance, a smaller amount fails with tecBAD_PROOF. Needs ConfidentialTransfer, CanClawback and CanHoldConfidentialBalance; the holder must be registered. Lock the holder first so the balance doesn't change. This tool cannot make the proof: get MPTAmount, ZKProof and Sequence from prepare-confidential-clawback and pass them unchanged.

Errors: tecBAD_PROOF (wrong amount), tecINSUFFICIENT_FUNDS, tecNO_PERMISSION, tecNO_TARGET, tecOBJECT_NOT_FOUND, temBAD_AMOUNT, temMALFORMED (sender not issuer, or Holder is the issuer).`,
  buildTransaction: params => params as ConfidentialMPTClawback,
})
