import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplHash256Schema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * SponsorshipTransfer-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/sponsorshiptransfer#sponsorshiptransfer-fields
 */
export const xrplSponsorshipTransferFieldsSchema = z.object({
  ObjectID: xrplHash256Schema
    .optional()
    .describe('ID of the ledger entry whose sponsorship is transferred. Omit to target the Account itself.'),
  Sponsee: xrplAddressSchema
    .optional()
    .describe(
      "Sponsee address. Required when the sponsor ends a sponsorship on the sponsee's behalf; otherwise Account is the sponsee.",
    ),
  Sponsor: xrplAddressSchema
    .optional()
    .describe('New sponsor. Required with tfSponsorshipCreate or tfSponsorshipReassign.'),
  SponsorFlags: z.number().int().optional().describe('Use 2 (spfSponsorReserve) when setting Sponsor.'),
})

/**
 * Complete SponsorshipTransfer transaction schema
 */
export const xrplSponsorshipTransferSchema = xrplCommonFieldsSchema
  .merge(xrplSponsorshipTransferFieldsSchema)
  .extend({ TransactionType: z.literal('SponsorshipTransfer') })

export type XrplSponsorshipTransferFields = z.infer<typeof xrplSponsorshipTransferFieldsSchema>
export type XrplSponsorshipTransfer = z.infer<typeof xrplSponsorshipTransferSchema>
