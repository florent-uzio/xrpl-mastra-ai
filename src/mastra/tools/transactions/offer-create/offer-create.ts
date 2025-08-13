import { Amount } from 'xrpl'
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

export const submitOfferCreateTool = createTransactionTool({
  toolId: 'submit-offer-create',
  description: `Submit an OfferCreate transaction to place a trade order in the XRPL decentralized exchange (DEX).

## What is OfferCreate?
Creates a trade order (Offer) in the DEX that can trade XRP with tokens, or tokens for other tokens. Offers that aren't fully filled immediately become Offer objects in the ledger and wait for matching trades.

## Required Fields:
- **TakerGets**: Amount and type of currency being sold (XRP string in drops or token object)
- **TakerPays**: Amount and type of currency being bought (XRP string in drops or token object)

## Optional Fields:
- **Expiration**: Time after which the Offer expires, in seconds since Ripple Epoch
- **OfferSequence**: Sequence number of an existing offer to cancel first
- **DomainID**: Permissioned domain ID for restricted DEX trading (requires PermissionedDEX amendment)

## OfferCreate Flags:
- **tfPassive** (65536): Do not consume exact matches, only cross offers (pegs exchange rate)
- **tfImmediateOrCancel** (131072): Immediate or Cancel order - don't place in order book
- **tfFillOrKill** (262144): Fill or Kill order - cancel if not fully filled
- **tfSell** (524288): Exchange entire TakerGets amount, even if getting more than TakerPays
- **tfHybrid** (1048576): Hybrid offer using both permissioned and open DEX (requires DomainID)

## Important Business Rules:
- **Different Assets**: Cannot trade same asset for itself (XRP for XRP, or same token)
- **Positive Amounts**: Both TakerGets and TakerPays must be positive
- **Sequence Validation**: OfferSequence must be less than transaction Sequence
- **Flag Dependencies**: tfHybrid requires DomainID field
- **Mutual Exclusivity**: Cannot use tfImmediateOrCancel and tfFillOrKill together
- **Funding Requirements**: Account must hold sufficient TakerGets currency (except for self-issued tokens)

## Offer Lifecycle:
1. **Immediate Execution**: Consumes matching/crossing offers to extent possible
2. **Order Book Placement**: Unfilled portion becomes Offer object in ledger
3. **Waiting Period**: Offer waits for other trades to consume it
4. **Cancellation**: Can be cancelled anytime by owner using OfferCancel
5. **Expiration**: Optional expiration time (uses ledger close time, not real-world time)

## Common Error Cases:
- **temBAD_OFFER**: Trading same asset for itself or negative amounts
- **temINVALID_FLAG**: Invalid flag combination or missing DomainID with tfHybrid
- **temREDUNDANT**: Trading same token (same issuer and currency)
- **tecUNFUNDED_OFFER**: Insufficient TakerGets currency balance
- **tecFROZEN**: Token involved is frozen
- **tecNO_LINE**: No trust line for authorized token
- **tecEXPIRED**: Expiration time has already passed
- **tecKILLED**: tfFillOrKill order cannot be fully filled

## Example Usage:
\`\`\`json
{
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "TakerGets": "6000000",
  "TakerPays": {
    "currency": "GKO",
    "issuer": "ruazs5h1qEsqpke88pcqnaseXdm6od2xc",
    "value": "2"
  },
  "Flags": 0,
  "TransactionType": "OfferCreate"
}
\`\`\`

**Note**: This creates an offer to sell 6 XRP for 2 GKO tokens. The offer will be placed in the order book if not immediately filled.`,
  buildTransaction: offerCreate => {
    const { TakerGets, TakerPays, ...rest } = offerCreate

    return {
      TakerGets: processOfferAmount(TakerGets),
      TakerPays: processOfferAmount(TakerPays),
      ...rest,
    }
  },
})
