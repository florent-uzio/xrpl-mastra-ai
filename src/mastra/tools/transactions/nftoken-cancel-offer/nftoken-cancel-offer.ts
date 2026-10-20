import { NFTokenCancelOffer } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplNFTokenCancelOfferSchema } from './nftoken-cancel-offer.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplNFTokenCancelOfferSchema,
})

export const submitNFTokenCancelOfferTool = createTransactionTool<NFTokenCancelOffer>({
  toolId: 'submit-nftoken-cancel-offer',
  description: `Submit an NFTokenCancelOffer transaction to remove one or more NFT buy/sell offers. No flags.

NFTokenOffers is a non-empty array of offer IDs (64 hex characters each). The sender must be the offer's creator or its Destination, unless the offer has expired or the NFT no longer exists, in which case anyone can cancel it.

Errors: tecNO_PERMISSION (sender may not cancel one of the offers), temMALFORMED (empty list or duplicates).`,
  buildTransaction: nftokenCancelOffer => {
    return nftokenCancelOffer
  },
})
