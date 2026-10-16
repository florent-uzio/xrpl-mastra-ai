import { useTransactionToolFactory } from '../factory'
import { xrplLoanManageSchema } from './loan-manage.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplLoanManageSchema,
})

export const submitLoanManageTool = createTransactionTool({
  toolId: 'submit-loan-manage',
  description: `Submit a LoanManage transaction to default, impair or unimpair a loan. Only the loan broker owner can send it. Requires the LendingProtocol amendment.

Set exactly one flag in Flags:
- tfLoanDefault (65536): default the loan and move funds from the broker to the vault. Requires fixCleanup3_4_0.
- tfLoanImpair (131072): mark the loan as impaired
- tfLoanUnimpair (262144): remove the impaired status

A loan cannot be defaulted or impaired before its due date and grace period have passed. Defaulted and fully paid loans cannot be changed.

Errors: tecNO_PERMISSION (loan already defaulted or paid, or status unchanged), tecTOO_SOON, tecLIMIT_EXCEEDED (impairment loss exceeds the vault's assets), tecNO_ENTRY, temINVALID_FLAG (more than one flag).`,
  buildTransaction: loanManage => {
    return loanManage
  },
})
