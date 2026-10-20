import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * DIDDelete has no transaction-specific fields
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/diddelete
 */
export const xrplDIDDeleteFieldsSchema = z.object({})

/**
 * Complete DIDDelete transaction schema (requires the DID amendment)
 */
export const xrplDIDDeleteSchema = xrplCommonFieldsSchema
  .merge(xrplDIDDeleteFieldsSchema)
  .extend({ TransactionType: z.literal('DIDDelete') })

export type XrplDIDDeleteFields = z.infer<typeof xrplDIDDeleteFieldsSchema>
export type XrplDIDDelete = z.infer<typeof xrplDIDDeleteSchema>
