import { useTransactionToolFactory } from '../factory'
import { xrplOfferCancelSchema } from './offer-cancel.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplOfferCancelSchema,
})

export const submitOfferCancelTool = createTransactionTool({
  toolId: 'submit-offer-cancel',
  description: `Submit an OfferCancel transaction to cancel an existing Offer in the XRPL decentralized exchange (DEX).

## What is OfferCancel?
Cancels an existing Offer in the DEX. If the Offer is not fully filled, the Offer object remains in the ledger and can be matched by other transactions.

## Required Fields:
- **OfferSequence**: Sequence number of the Offer to cancel`,
  buildTransaction: offerCancel => {
    return offerCancel
  },
})
