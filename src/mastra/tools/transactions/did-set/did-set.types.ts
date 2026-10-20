import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHexBlobSchema } from '../shared/transaction-fields'

/**
 * DIDSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/didset#didset-fields
 */
export const xrplDIDSetFieldsSchema = z.object({
  // At least one of the three fields is required
  Data: xrplHexBlobSchema(256)
    .optional()
    .describe('Hex-encoded public attestations of identity credentials associated with the DID, up to 256 bytes'),
  DIDDocument: xrplHexBlobSchema(256)
    .optional()
    .describe('Hex-encoded DID document associated with the DID, up to 256 bytes'),
  URI: xrplHexBlobSchema(256)
    .optional()
    .describe('Hex-encoded Universal Resource Identifier associated with the DID, up to 256 bytes'),
})

/**
 * Complete DIDSet transaction schema (requires the DID amendment)
 */
export const xrplDIDSetSchema = xrplCommonFieldsSchema
  .merge(xrplDIDSetFieldsSchema)
  .extend({ TransactionType: z.literal('DIDSet') })

export type XrplDIDSetFields = z.infer<typeof xrplDIDSetFieldsSchema>
export type XrplDIDSet = z.infer<typeof xrplDIDSetSchema>
