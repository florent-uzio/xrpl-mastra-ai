import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHash256Schema } from '../shared/transaction-fields'

/**
 * CheckCancel-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/checkcancel#checkcancel-fields
 */
export const xrplCheckCancelFieldsSchema = z.object({
  CheckID: xrplHash256Schema.describe(
    'The ID of the Check ledger entry to cancel, as a 64-character hex string. The Check can be cancelled by its sender or its destination at any time, and by anyone once it has expired.',
  ),
})

/**
 * Complete CheckCancel transaction schema
 */
export const xrplCheckCancelSchema = xrplCommonFieldsSchema
  .merge(xrplCheckCancelFieldsSchema)
  .extend({ TransactionType: z.literal('CheckCancel') })

export type XrplCheckCancelFields = z.infer<typeof xrplCheckCancelFieldsSchema>
export type XrplCheckCancel = z.infer<typeof xrplCheckCancelSchema>
