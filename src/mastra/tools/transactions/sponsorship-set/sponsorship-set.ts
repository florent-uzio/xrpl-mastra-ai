import { SponsorshipSet } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplSponsorshipSetSchema } from './sponsorship-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplSponsorshipSetSchema,
})

export const submitSponsorshipSetTool = createTransactionTool<SponsorshipSet>({
  toolId: 'submit-sponsorship-set',
  description: `Submit a SponsorshipSet transaction to create, update or delete a Sponsorship, where a sponsor pre-funds a sponsee's fees and reserves. Requires the Sponsor amendment.

Set exactly ONE of Sponsee (Account is the sponsor) or CounterpartySponsor (Account is the sponsee). Budgets use deltas: FeeAmountDelta (drops, string) and RemainingOwnerCountDelta (integer), positive adds and negative removes; both must be positive when creating. MaxFee caps the fee per sponsored transaction.

Flags (optional): tfSponsorshipSetRequireSignForFee 65536, tfSponsorshipClearRequireSignForFee 131072, tfSponsorshipSetRequireSignForReserve 262144, tfSponsorshipClearRequireSignForReserve 524288, tfDeleteObject 1048576 (delete the Sponsorship, must be the only flag; remaining fee XRP returns to the sponsor).`,
  buildTransaction: sponsorshipSet => {
    return sponsorshipSet as SponsorshipSet
  },
  validateTransaction: ({ Sponsee, CounterpartySponsor }) => {
    if (!Sponsee === !CounterpartySponsor) {
      throw new Error('Set exactly one of Sponsee or CounterpartySponsor')
    }
  },
})
