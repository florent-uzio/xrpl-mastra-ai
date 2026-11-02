import { OfferCreate } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplOfferCreateSchema } from './offer-create.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplOfferCreateSchema,
})

export const submitOfferCreateTool = createTransactionTool<OfferCreate>({
  toolId: 'submit-offer-create',
  description: `Submit an OfferCreate transaction to place an order on the XRPL DEX. It matches existing offers first, and any unfilled remainder stays in the ledger.

TakerGets is what you sell. TakerPays is what you buy. XRP is a string in drops. Tokens are {currency, issuer, value}. You cannot trade an asset for itself, and both amounts must be positive.

Flags is a number: add the values of the flags you want, e.g. tfPassive + tfSell = 589824.
- tfPassive 65536: do not take exact-rate matches
- tfImmediateOrCancel 131072: never place the remainder on the book
- tfFillOrKill 262144: cancel unless fully filled (cannot combine with tfImmediateOrCancel)
- tfSell 524288: sell all of TakerGets even if you receive more than TakerPays
- tfHybrid 1048576: permissioned and open DEX (requires DomainID)

Other fields: OfferSequence cancels an earlier offer first. Expiration is in seconds since the Ripple Epoch. DomainID is for permissioned DEX trading.

Errors: tecUNFUNDED_OFFER (insufficient TakerGets balance), tecKILLED (fill-or-kill not filled), tecFROZEN, tecNO_LINE.`,
})
