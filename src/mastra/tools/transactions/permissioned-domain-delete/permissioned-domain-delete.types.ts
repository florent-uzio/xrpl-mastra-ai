import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHash256Schema } from '../shared/transaction-fields'

/**
 * PermissionedDomainDelete-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/permissioneddomaindelete#permissioneddomaindelete-fields
 */
export const xrplPermissionedDomainDeleteFieldsSchema = z.object({
  DomainID: xrplHash256Schema.describe(
    'ID (64-character hex) of the PermissionedDomain ledger entry to delete. Account must own the domain.',
  ),
})

/**
 * Complete PermissionedDomainDelete transaction schema (requires the PermissionedDomains amendment)
 */
export const xrplPermissionedDomainDeleteSchema = xrplCommonFieldsSchema
  .merge(xrplPermissionedDomainDeleteFieldsSchema)
  .extend({ TransactionType: z.literal('PermissionedDomainDelete') })

export type XrplPermissionedDomainDeleteFields = z.infer<typeof xrplPermissionedDomainDeleteFieldsSchema>
export type XrplPermissionedDomainDelete = z.infer<typeof xrplPermissionedDomainDeleteSchema>
