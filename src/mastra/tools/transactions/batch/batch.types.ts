import { z } from 'zod'
import { Batch } from 'xrpl'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * Batch-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/batch#batch-fields
 */
export const xrplBatchFieldsSchema = z.object({
  // Required field
  RawTransactions: z
    .array(
      z.object({
        RawTransaction: z
          .looseObject({
            TransactionType: z.string().describe('Inner transaction type, e.g. "Payment"'),
            Account: z.string().describe('Account sending the inner transaction (r-address)'),
          })
          .describe(
            'Inner transaction with its normal fields. Never include Fee, SigningPubKey, TxnSignature or Signers.',
          ),
      }),
    )
    .min(2)
    .max(8)
    .describe('2 to 8 inner transactions, applied in order. Nested Batch is not allowed.'),

  // Optional field
  BatchSigners: z
    .array(
      z.object({
        BatchSigner: z.object({
          Account: z.string().describe('Inner-transaction account other than the outer Account'),
          SigningPubKey: z.string().optional().describe('Hex public key (single-signing)'),
          TxnSignature: z.string().optional().describe('Hex batch signature (single-signing)'),
          Signers: xrplCommonFieldsSchema.shape.Signers.optional().describe('Multi-signing entries'),
        }),
      }),
    )
    .optional()
    .describe('Signatures from every inner-transaction account other than the outer Account'),

  // Not a protocol field: used by the tool to sign, then removed before submission
  innerSeeds: z
    .array(z.string())
    .optional()
    .describe(
      'Testnet/devnet only: seeds of the inner-transaction accounts other than the outer Account. The tool signs their BatchSigners automatically.',
    ),
})

/**
 * Complete Batch transaction schema
 */
export const xrplBatchSchema = xrplCommonFieldsSchema.extend({
  ...xrplBatchFieldsSchema.shape,
  TransactionType: z.literal('Batch'),
})

export type XrplBatchFields = z.infer<typeof xrplBatchFieldsSchema>
/** xrpl.js Batch plus the tool-only innerSeeds field */
export type XrplBatch = Batch & Pick<XrplBatchFields, 'innerSeeds'>
