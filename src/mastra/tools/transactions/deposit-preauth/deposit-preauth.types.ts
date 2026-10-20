import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHexBlobSchema } from '../shared'

/**
 * Credential wrapper schema used by AuthorizeCredentials and UnauthorizeCredentials
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/depositpreauth#depositpreauth-fields
 */
export const xrplAuthorizeCredentialSchema = z.object({
  Credential: z.object({
    Issuer: xrplAddressSchema.describe('Address (r-address) of the account that issued the credential.'),
    CredentialType: xrplHexBlobSchema(64).describe(
      'Hex-encoded type of the credential, 1 to 64 bytes. Defined by the issuer, e.g. hex of "KYC".',
    ),
  }),
})

const credentialsArraySchema = z.array(xrplAuthorizeCredentialSchema).min(1).max(8)

/**
 * DepositPreauth-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/depositpreauth#depositpreauth-fields
 */
export const xrplDepositPreauthFieldsSchema = z.object({
  // Exactly one of the following four fields must be provided
  Authorize: xrplAddressSchema
    .optional()
    .describe(
      'Address (r-address) of the account to preauthorize to send payments to the sender. Cannot be the sender. Use exactly one of Authorize, Unauthorize, AuthorizeCredentials, UnauthorizeCredentials.',
    ),
  Unauthorize: xrplAddressSchema
    .optional()
    .describe(
      'Address (r-address) of a previously preauthorized account whose preauthorization to remove. Use exactly one of Authorize, Unauthorize, AuthorizeCredentials, UnauthorizeCredentials.',
    ),
  AuthorizeCredentials: credentialsArraySchema
    .optional()
    .describe(
      'Set of 1 to 8 credentials (Issuer + CredentialType) to preauthorize: any sender holding all of them accepted is allowed to pay the sender. No duplicates. Requires the Credentials amendment. Use exactly one of the four authorize/unauthorize fields.',
    ),
  UnauthorizeCredentials: credentialsArraySchema
    .optional()
    .describe(
      'Set of 1 to 8 credentials (Issuer + CredentialType) whose preauthorization to remove. Must match an existing preauthorization. Requires the Credentials amendment. Use exactly one of the four authorize/unauthorize fields.',
    ),
})

/**
 * Complete DepositPreauth transaction schema
 */
export const xrplDepositPreauthSchema = xrplCommonFieldsSchema
  .merge(xrplDepositPreauthFieldsSchema)
  .extend({ TransactionType: z.literal('DepositPreauth') })
  .refine(
    tx =>
      [tx.Authorize, tx.Unauthorize, tx.AuthorizeCredentials, tx.UnauthorizeCredentials].filter(
        field => field !== undefined,
      ).length === 1,
    { message: 'Provide exactly one of Authorize, Unauthorize, AuthorizeCredentials, UnauthorizeCredentials' },
  )

export type XrplDepositPreauthFields = z.infer<typeof xrplDepositPreauthFieldsSchema>
export type XrplDepositPreauth = z.infer<typeof xrplDepositPreauthSchema>
