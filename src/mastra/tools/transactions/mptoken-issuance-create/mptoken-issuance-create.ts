import { MPTokenIssuanceCreate } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplMPTokenIssuanceCreateSchema } from './mptoken-issuance-create.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplMPTokenIssuanceCreateSchema,
})

export const submitMPTokenIssuanceCreateTool = createTransactionTool<MPTokenIssuanceCreate>({
  toolId: 'submit-mptoken-issuance-create',
  description: `Submit an MPTokenIssuanceCreate transaction to create an MPT issuance. The sender becomes the issuer. The issuance ID is in the result metadata (mpt_issuance_id). Adds to the issuer's reserve.

Flags (sum values; capabilities cannot be changed later unless DynamicMPT): 2 CanLock, 4 RequireAuth, 8 CanEscrow, 16 CanTrade, 32 CanTransfer, 64 CanClawback, 128 CanHoldConfidentialBalance (needs ConfidentialTransfer; no TransferFee).

Errors: temMALFORMED (TransferFee without CanTransfer, DomainID without RequireAuth, bad metadata size or MaximumAmount), temBAD_TRANSFER_FEE, temDISABLED, tecINSUFFICIENT_RESERVE, tecDIR_FULL.`,
  buildTransaction: params => params as MPTokenIssuanceCreate,
})
