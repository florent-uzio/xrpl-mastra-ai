import { convertStringToHex } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplAccountSetSchema } from './account-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplAccountSetSchema,
})

export const submitAccountSetTool = createTransactionTool({
  toolId: 'submit-account-set',
  description: `Submit an AccountSet transaction to change account settings (flags, domain, transfer rate, tick size, NFT minter, etc.).

Use SetFlag / ClearFlag with a single asf* value. Do not use Flags for account settings, except when you need tf* flags.

asf* values: 1 RequireDest, 2 RequireAuth, 3 DisallowXRP, 4 DisableMaster, 5 AccountTxnID, 6 NoFreeze, 7 GlobalFreeze, 8 DefaultRipple, 9 DepositAuth, 10 AuthorizedNFTokenMinter, 12 DisallowIncomingNFTokenOffer, 13 DisallowIncomingCheck, 14 DisallowIncomingPayChan, 15 DisallowIncomingTrustline, 16 AllowTrustLineClawback, 17 AllowTrustLineLocking.

Irreversible or risky: NoFreeze (6) and AllowTrustLineClawback (16) cannot be undone. DisableMaster (4) can lock you out if no other signing method exists. GlobalFreeze (7) freezes every token you issued.

Only one asf* flag can be set per transaction. Submit one transaction per flag.

Limits: TransferRate 1000000000-2000000000. TickSize 3-15. Domain is hex-encoded automatically.`,
  buildTransaction: params => {
    return {
      ...params,
      Domain: params.Domain ? convertStringToHex(params.Domain) : undefined,
      TransactionType: 'AccountSet',
    }
  },
  validateTransaction: params => {
    if (params.TransferRate !== undefined && params.TransferRate < 1000000000) {
      throw new Error('TransferRate must be greater than or equal to 1000000000')
    }
    if (params.TransferRate !== undefined && params.TransferRate > 2000000000) {
      throw new Error('TransferRate must be less than or equal to 2000000000')
    }
    if (params.TickSize !== undefined && params.TickSize < 3) {
      throw new Error('TickSize must be greater than or equal to 3')
    }
    if (params.TickSize !== undefined && params.TickSize > 15) {
      throw new Error('TickSize must be less than or equal to 15')
    }
  },
})
