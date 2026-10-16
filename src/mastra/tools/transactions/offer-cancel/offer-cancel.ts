import { useTransactionToolFactory } from '../factory'
import { xrplOfferCancelSchema } from './offer-cancel.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplOfferCancelSchema,
})

export const submitOfferCancelTool = createTransactionTool({
  toolId: 'submit-offer-cancel',
  description: `Submit an OfferCancel transaction to remove one of your DEX offers. OfferSequence is the sequence number of the transaction that created the offer. You can find it with get-account-offers.`,
  buildTransaction: offerCancel => {
    return offerCancel
  },
})
