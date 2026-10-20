import { NFTokenCreateOffer } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { encodeCurrencyCodes } from '../shared'
import { xrplNFTokenCreateOfferSchema } from './nftoken-create-offer.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplNFTokenCreateOfferSchema,
})

export const submitNFTokenCreateOfferTool = createTransactionTool<NFTokenCreateOffer>({
  toolId: 'submit-nftoken-create-offer',
  description: `Submit an NFTokenCreateOffer transaction to create a buy or sell offer for an NFT. The response contains the new offer ID.

Flags: tfSellNFToken (1) makes it a sell offer. Without it, it is a buy offer.

Rules:
- Sell offer (tfSellNFToken): the sender owns the NFT. Omit Owner. Amount may be 0 XRP to give the NFT away.
- Buy offer: Owner (current NFT owner) is required and Amount must be greater than 0. The sender must hold the funds.
- Amount is XRP in drops (string) or a token {currency, issuer, value}. NFTs with tfOnlyXRP only accept XRP.
- Destination restricts who can accept. Owner and Destination must not equal the sender.
- Expiration is in seconds since the Ripple Epoch.
- Each offer costs an owner reserve.

Errors: tecNO_ENTRY (NFT not found), tecUNFUNDED_OFFER, tecNO_PERMISSION, tecFROZEN, tecINSUFFICIENT_RESERVE, tecEXPIRED.`,
  buildTransaction: nftokenCreateOffer => {
    return { ...nftokenCreateOffer, Amount: encodeCurrencyCodes(nftokenCreateOffer.Amount) }
  },
})
