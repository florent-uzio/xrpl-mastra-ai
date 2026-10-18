import { Amount, OfferCreate } from 'xrpl'
import { currencyCodeToHex, isString } from '../../../../helpers'
import { useTransactionToolFactory } from '../factory'
import { xrplOfferCreateSchema } from './offer-create.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplOfferCreateSchema,
})

/**
 * Helper function to process OfferCreate amount fields
 * Handles string amounts (XRP) and currency objects (tokens)
 */
const processOfferAmount = (amount: Amount): Amount => {
  // If it's a string (XRP amount in drops), return as is
  if (isString(amount)) {
    return amount
  }

  // If it's a currency object, convert currency to hex and return
  return {
    ...amount,
    currency: currencyCodeToHex(amount.currency),
  }
}

export const submitOfferCreateTool = createTransactionTool<OfferCreate>({
  toolId: 'submit-offer-create',
  description: `Submit an OfferCreate transaction to place an order on the XRPL DEX. It matches existing offers first, and any unfilled remainder stays in the ledger.

TakerGets is what you sell. TakerPays is what you buy. XRP is a string in drops. Tokens are {currency, issuer, value}. You cannot trade an asset for itself, and both amounts must be positive.

Flags:
- tfPassive: do not take exact-rate matches
- tfImmediateOrCancel: never place the remainder on the book
- tfFillOrKill: cancel unless fully filled (cannot combine with tfImmediateOrCancel)
- tfSell: sell all of TakerGets even if you receive more than TakerPays
- tfHybrid: permissioned and open DEX (requires DomainID)

Other fields: OfferSequence cancels an earlier offer first. Expiration is in seconds since the Ripple Epoch. DomainID is for permissioned DEX trading.

Errors: tecUNFUNDED_OFFER (insufficient TakerGets balance), tecKILLED (fill-or-kill not filled), tecFROZEN, tecNO_LINE.`,
  buildTransaction: offerCreate => {
    const { TakerGets, TakerPays, ...rest } = offerCreate

    return {
      TakerGets: processOfferAmount(TakerGets),
      TakerPays: processOfferAmount(TakerPays),
      ...rest,
    }
  },
})
