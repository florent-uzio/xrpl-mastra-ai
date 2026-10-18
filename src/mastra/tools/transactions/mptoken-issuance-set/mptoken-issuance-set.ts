import { MPTokenIssuanceSet } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplMPTokenIssuanceSetSchema } from './mptoken-issuance-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplMPTokenIssuanceSetSchema,
})

export const submitMPTokenIssuanceSetTool = createTransactionTool<MPTokenIssuanceSet>({
  toolId: 'submit-mptoken-issuance-set',
  description: `Submit an MPTokenIssuanceSet transaction (issuer only) to lock/unlock balances or update an issuance.

Flags: 1 Lock, 2 Unlock (need CanLock; send alone, no DomainID; Holder optional). Irreversible enables, need DynamicMPT: 4 CanLock, 8 RequireAuth, 16 CanEscrow, 32 CanTrade, 64 CanTransfer, 128 CanClawback, 256 CanHoldConfidentialBalance (ConfidentialTransfer; no Holder).

Encryption keys (ConfidentialTransfer) are set without Holder or lock flags.

Errors: tecNO_PERMISSION (not CanLock, or field/flag immutable), temMALFORMED (no change, Holder with DomainID/keys, AuditorEncryptionKey without IssuerEncryptionKey), temINVALID_FLAG, temBAD_TRANSFER_FEE, tecNO_DST, tecOBJECT_NOT_FOUND.`,
  buildTransaction: params => params as MPTokenIssuanceSet,
})
