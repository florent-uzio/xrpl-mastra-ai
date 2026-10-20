import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHexBlobSchema } from '../shared/transaction-fields'

/**
 * CredentialCreate-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/credentialcreate#credentialcreate-fields
 */
export const xrplCredentialCreateFieldsSchema = z.object({
  // Required fields
  Subject: xrplAddressSchema.describe(
    'The account the credential is issued to (r-address). Account (the transaction sender) is the issuer.',
  ),
  CredentialType: xrplHexBlobSchema(64).describe(
    'Hex-encoded type of the credential, 1 to 64 bytes. Defined by the issuer; (Issuer, Subject, CredentialType) must be unique.',
  ),

  // Optional fields
  Expiration: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe(
      'Time after which the credential expires, in seconds since the Ripple Epoch (2000-01-01T00:00:00Z). Must not be in the past.',
    ),
  URI: xrplHexBlobSchema(256)
    .optional()
    .describe('Hex-encoded URI with additional data about the credential, up to 256 bytes'),
})

/**
 * Complete CredentialCreate transaction schema (requires the Credentials amendment)
 */
export const xrplCredentialCreateSchema = xrplCommonFieldsSchema
  .merge(xrplCredentialCreateFieldsSchema)
  .extend({ TransactionType: z.literal('CredentialCreate') })

export type XrplCredentialCreateFields = z.infer<typeof xrplCredentialCreateFieldsSchema>
export type XrplCredentialCreate = z.infer<typeof xrplCredentialCreateSchema>
