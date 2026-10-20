import { OracleDelete } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplOracleDeleteSchema } from './oracle-delete.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplOracleDeleteSchema,
})

export const submitOracleDeleteTool = createTransactionTool<OracleDelete>({
  toolId: 'submit-oracle-delete',
  description: `Submit an OracleDelete transaction to delete a price Oracle owned by Account. Requires the PriceOracle amendment. OracleDocumentID is the uint32 identifier chosen in OracleSet. Common error: tecNO_ENTRY (no such Oracle).`,
  buildTransaction: oracleDelete => {
    return oracleDelete as OracleDelete
  },
})
