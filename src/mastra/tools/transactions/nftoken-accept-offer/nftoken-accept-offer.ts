import { NFTokenAcceptOffer } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplNFTokenAcceptOfferSchema } from './nftoken-accept-offer.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplNFTokenAcceptOfferSchema,
})

export const submitNFTokenAcceptOfferTool = createTransactionTool<NFTokenAcceptOffer>({
  toolId: 'submit-nftoken-accept-offer',
  description: `Submit an NFTokenAcceptOffer transaction to buy or sell an NFT by accepting an existing NFTokenOffer. No flags.

Modes (at least one offer ID is required):
- Direct sell: set NFTokenSellOffer only, the sender buys the NFT.
- Direct buy: set NFTokenBuyOffer only, the sender (the NFT owner) sells the NFT.
- Brokered: set both. The sender is a broker bridging the two offers and may keep NFTokenBrokerFee.

NFTokenBrokerFee is only for brokered mode, must be greater than 0 (omit if none) and uses the same currency/issuer as the offers. XRP amounts are drops, tokens are {currency, issuer, value}. Offer IDs are 64 hex characters (get them with get-account-objects or the NFTokenCreateOffer result).

Errors: tecOBJECT_NOT_FOUND (offer missing or expired), tecCANT_ACCEPT_OWN_NFTOKEN_OFFER, tecNFTOKEN_BUY_SELL_MISMATCH, tecINSUFFICIENT_PAYMENT, tecNO_PERMISSION (offer has a different Destination), tecINSUFFICIENT_FUNDS, tecINSUFFICIENT_RESERVE.`,
  buildTransaction: nftokenAcceptOffer => {
    const { NFTokenBrokerFee, ...rest } = nftokenAcceptOffer

    return {
      ...rest,
      ...(NFTokenBrokerFee !== undefined && { NFTokenBrokerFee: encodeCurrencyCodes(NFTokenBrokerFee) }),
    }
  },
})
