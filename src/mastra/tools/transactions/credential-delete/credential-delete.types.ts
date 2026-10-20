import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHexBlobSchema } from '../shared/transaction-fields'

/**
 * CredentialDelete-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/credentialdelete#credentialdelete-fields
 */
export const xrplCredentialDeleteFieldsSchema = z.object({
  CredentialType: xrplHexBlobSchema(64).describe(
    'Hex-encoded type of the credential to delete, 1 to 64 bytes. Must match the credential being deleted.',
  ),
  Subject: xrplAddressSchema
    .optional()
    .describe('The account the credential was issued to (r-address). Defaults to Account if omitted.'),
  Issuer: xrplAddressSchema
    .optional()
    .describe('The account that issued the credential (r-address). Defaults to Account if omitted.'),
})

/**
 * Complete CredentialDelete transaction schema (requires the Credentials amendment)
 */
export const xrplCredentialDeleteSchema = xrplCommonFieldsSchema
  .merge(xrplCredentialDeleteFieldsSchema)
  .extend({ TransactionType: z.literal('CredentialDelete') })

export type XrplCredentialDeleteFields = z.infer<typeof xrplCredentialDeleteFieldsSchema>
export type XrplCredentialDelete = z.infer<typeof xrplCredentialDeleteSchema>
