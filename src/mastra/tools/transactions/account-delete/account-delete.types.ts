import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHash256Schema } from '../shared'

/**
 * AccountDelete-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/accountdelete#accountdelete-fields
 */
export const xrplAccountDeleteFieldsSchema = z.object({
  // Required field
  Destination: xrplAddressSchema.describe(
    'Address (r-address) of an account to receive any leftover XRP after deleting the sender account. Must already exist and cannot be the sender. If it requires Deposit Authorization, the sender must be preauthorized (or provide CredentialIDs).',
  ),

  // Optional fields
  DestinationTag: z
    .number()
    .int()
    .min(0)
    .max(4294967295)
    .optional()
    .describe(
      'Arbitrary 32-bit destination tag identifying a reason for the deletion or a hosted beneficiary. Required if the Destination has the RequireDest flag.',
    ),
  CredentialIDs: z
    .array(xrplHash256Schema)
    .optional()
    .describe(
      'Credential ledger entry IDs (64 hex characters each) that authorize the sender to deliver funds to a Destination using Deposit Authorization. Requires the Credentials amendment.',
    ),
})

/**
 * Complete AccountDelete transaction schema
 */
export const xrplAccountDeleteSchema = xrplCommonFieldsSchema
  .merge(xrplAccountDeleteFieldsSchema)
  .extend({ TransactionType: z.literal('AccountDelete') })

export type XrplAccountDeleteFields = z.infer<typeof xrplAccountDeleteFieldsSchema>
export type XrplAccountDelete = z.infer<typeof xrplAccountDeleteSchema>
