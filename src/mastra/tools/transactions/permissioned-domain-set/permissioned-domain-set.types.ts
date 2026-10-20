import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHash256Schema, xrplHexBlobSchema } from '../shared/transaction-fields'

/**
 * One accepted credential entry
 */
export const xrplAuthorizeCredentialSchema = z.object({
  Credential: z.object({
    Issuer: xrplAddressSchema.describe('The account that issues the accepted credential (r-address)'),
    CredentialType: xrplHexBlobSchema(64).describe('Hex-encoded type of the accepted credential, 1 to 64 bytes'),
  }),
})

/**
 * PermissionedDomainSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/permissioneddomainset#permissioneddomainset-fields
 */
export const xrplPermissionedDomainSetFieldsSchema = z.object({
  // Required field
  AcceptedCredentials: z
    .array(xrplAuthorizeCredentialSchema)
    .min(1)
    .max(10)
    .describe(
      'Array of 1 to 10 credentials (Issuer + CredentialType) that grant access to the domain. Entries must be unique. Replaces the existing list when updating.',
    ),

  // Optional field
  DomainID: xrplHash256Schema
    .optional()
    .describe(
      'ID (64-character hex) of an existing permissioned domain to update. Omit to create a new domain. Account must own the domain.',
    ),
})

/**
 * Complete PermissionedDomainSet transaction schema (requires the PermissionedDomains amendment)
 */
export const xrplPermissionedDomainSetSchema = xrplCommonFieldsSchema
  .merge(xrplPermissionedDomainSetFieldsSchema)
  .extend({ TransactionType: z.literal('PermissionedDomainSet') })

export type XrplPermissionedDomainSetFields = z.infer<typeof xrplPermissionedDomainSetFieldsSchema>
export type XrplPermissionedDomainSet = z.infer<typeof xrplPermissionedDomainSetSchema>
