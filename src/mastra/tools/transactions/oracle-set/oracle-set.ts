import { OracleSet } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplOracleSetSchema } from './oracle-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplOracleSetSchema,
})

export const submitOracleSetTool = createTransactionTool<OracleSet>({
  toolId: 'submit-oracle-set',
  description: `Submit an OracleSet transaction to create or update a price Oracle owned by Account. Requires the PriceOracle amendment.

Fields: OracleDocumentID (uint32, with Account identifies the Oracle), LastUpdateTime (Unix seconds, NOT Ripple Epoch; within 300s of ledger close time and not older than the stored value), PriceDataSeries (1-10 entries of PriceData {BaseAsset, QuoteAsset, AssetPrice, Scale}; price = AssetPrice * 10^-Scale, Scale 0-10). When creating, Provider (hex, max 256 bytes) and AssetClass (hex, max 16 bytes) are required; URI (hex, max 256 bytes) is optional. To update, submit pairs to change; to remove a pair, send it without AssetPrice and Scale. Common errors: tecINSUFFICIENT_RESERVE, tecARRAY_TOO_LARGE (more than 10 pairs total), tecTOO_SOON/tecINVALID_UPDATE_TIME (bad LastUpdateTime).`,
  buildTransaction: oracleSet => {
    return oracleSet as OracleSet
  },
})
