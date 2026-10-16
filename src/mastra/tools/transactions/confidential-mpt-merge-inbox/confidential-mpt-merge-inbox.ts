import { ConfidentialMPTMergeInbox } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplConfidentialMPTMergeInboxSchema } from './confidential-mpt-merge-inbox.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplConfidentialMPTMergeInboxSchema,
})

export const submitConfidentialMPTMergeInboxTool = createTransactionTool({
  toolId: 'submit-confidential-mpt-merge-inbox',
  description: `Submit a ConfidentialMPTMergeInbox transaction: move a holder's confidential inbox balance into the spending balance and reset the inbox. Needed to spend received confidential funds. Holder only, not the issuer. Needs ConfidentialTransfer. No proof needed.

Errors: tecLOCKED, tecNO_AUTH, tecNO_PERMISSION (no CanHoldConfidentialBalance or holder not registered), tecOBJECT_NOT_FOUND, temMALFORMED.`,
  buildTransaction: params => params as ConfidentialMPTMergeInbox,
})
