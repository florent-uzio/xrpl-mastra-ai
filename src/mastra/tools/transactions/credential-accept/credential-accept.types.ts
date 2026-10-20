import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHexBlobSchema } from '../shared/transaction-fields'

/**
 * CredentialAccept-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/credentialaccept#credentialaccept-fields
 */
export const xrplCredentialAcceptFieldsSchema = z.object({
  Issuer: xrplAddressSchema.describe(
    'The account that issued the credential being accepted (r-address). Account (the transaction sender) must be the credential Subject.',
  ),
  CredentialType: xrplHexBlobSchema(64).describe(
    'Hex-encoded type of the credential to accept, 1 to 64 bytes. Must match the CredentialType of the pending credential created by Issuer for Account.',
  ),
})

/**
 * Complete CredentialAccept transaction schema (requires the Credentials amendment)
 */
export const xrplCredentialAcceptSchema = xrplCommonFieldsSchema
  .merge(xrplCredentialAcceptFieldsSchema)
  .extend({ TransactionType: z.literal('CredentialAccept') })

export type XrplCredentialAcceptFields = z.infer<typeof xrplCredentialAcceptFieldsSchema>
export type XrplCredentialAccept = z.infer<typeof xrplCredentialAcceptSchema>
