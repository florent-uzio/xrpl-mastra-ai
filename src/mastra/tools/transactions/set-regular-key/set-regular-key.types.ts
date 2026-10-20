import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * SetRegularKey-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/setregularkey#setregularkey-fields
 */
export const xrplSetRegularKeyFieldsSchema = z.object({
  // Optional field
  RegularKey: xrplAddressSchema
    .optional()
    .describe(
      'Address (r-address) of the key pair to use as the regular key for this account, in place of any existing regular key. Cannot be the account itself. If omitted, removes the existing regular key from the account.',
    ),
})

/**
 * Complete SetRegularKey transaction schema
 */
export const xrplSetRegularKeySchema = xrplCommonFieldsSchema
  .merge(xrplSetRegularKeyFieldsSchema)
  .extend({ TransactionType: z.literal('SetRegularKey') })

export type XrplSetRegularKeyFields = z.infer<typeof xrplSetRegularKeyFieldsSchema>
export type XrplSetRegularKey = z.infer<typeof xrplSetRegularKeySchema>
