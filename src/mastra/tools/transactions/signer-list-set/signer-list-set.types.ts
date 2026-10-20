import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHash256Schema } from '../shared'

/**
 * SignerEntry wrapper schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/signerlistset#signerentry-object
 */
export const xrplSignerEntrySchema = z.object({
  SignerEntry: z.object({
    Account: xrplAddressSchema.describe(
      'Address (r-address) of an account that can authorize transactions as part of the multi-signing list. Cannot be the owner account and must be unique in the list.',
    ),
    SignerWeight: z
      .number()
      .int()
      .min(1)
      .max(65535)
      .describe(
        "The weight of a signature from this signer (1 to 65535). A multi-signature is valid only if the sum of the weights of the signatures provided meets or exceeds the list's SignerQuorum.",
      ),
    WalletLocator: xrplHash256Schema
      .optional()
      .describe('Optional 256-bit (64 hex characters) arbitrary hash, for example to identify the signer wallet.'),
  }),
})

/**
 * SignerListSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/signerlistset#signerlistset-fields
 */
export const xrplSignerListSetFieldsSchema = z.object({
  // Required field
  SignerQuorum: z
    .number()
    .int()
    .min(0)
    .describe(
      'Target number for the signer weights. A multi-signature from this list is valid only if the sum of the weights of the signatures provided is greater than or equal to this value. Must be at most the sum of all SignerWeight values. To delete the signer list, set this to 0 and omit SignerEntries.',
    ),

  // Optional field
  SignerEntries: z
    .array(xrplSignerEntrySchema)
    .min(1)
    .max(32)
    .optional()
    .describe(
      'Array of 1 to 32 SignerEntry objects, the signers of the multi-signing list. Required when SignerQuorum is greater than 0. Must be omitted when deleting the list (SignerQuorum 0). Accounts must be unique and cannot include the sender.',
    ),
})

/**
 * Complete SignerListSet transaction schema
 */
export const xrplSignerListSetSchema = xrplCommonFieldsSchema
  .merge(xrplSignerListSetFieldsSchema)
  .extend({ TransactionType: z.literal('SignerListSet') })

export type XrplSignerListSetFields = z.infer<typeof xrplSignerListSetFieldsSchema>
export type XrplSignerListSet = z.infer<typeof xrplSignerListSetSchema>
