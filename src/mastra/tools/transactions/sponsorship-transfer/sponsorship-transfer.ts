import { SponsorshipTransfer } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplSponsorshipTransferSchema } from './sponsorship-transfer.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplSponsorshipTransferSchema,
})

export const submitSponsorshipTransferTool = createTransactionTool<SponsorshipTransfer>({
  toolId: 'submit-sponsorship-transfer',
  description: `Submit a SponsorshipTransfer transaction to create, reassign or end reserve sponsorship of a ledger object or account. Requires the Sponsor amendment. Cannot be delegated.

Flags must be exactly ONE: tfSponsorshipEnd 65536 (reserve returns to the owner), tfSponsorshipCreate 131072 (sponsor an unsponsored object/account), tfSponsorshipReassign 262144 (move to a new sponsor).

ObjectID: the sponsored ledger entry; omit to target Account itself. Sponsee: needed when the sponsor ends the sponsorship on the sponsee's behalf. Sponsor (new sponsor, with SponsorFlags 2) is needed for create and reassign.`,
  buildTransaction: sponsorshipTransfer => {
    return sponsorshipTransfer as SponsorshipTransfer
  },
  validateTransaction: ({ Flags }) => {
    const flags = typeof Flags === 'number' ? Flags : 0
    const modes = [65536, 131072, 262144].filter(flag => flags & flag)

    if (modes.length !== 1) {
      throw new Error('Flags must set exactly one of tfSponsorshipEnd, tfSponsorshipCreate or tfSponsorshipReassign')
    }
  },
})
