import { z } from 'zod'

// XRPL Common Transaction Fields schema
// Reference: https://xrpl.org/docs/references/protocol/transactions/common-fields

// Memo inner object schema
export const xrplMemoSchema = z.object({
  MemoData: z.string().optional().describe('Arbitrary hex value; conventionally the memo content'),
  MemoFormat: z.string().optional().describe('Hex value; conventionally indicates encoding (e.g., MIME type)'),
  MemoType: z.string().optional().describe('Hex value; conventionally a unique relation that defines the memo format'),
})

// Memo wrapper schema
export const xrplMemosSchema = z
  .array(
    z.object({
      Memo: xrplMemoSchema,
    }),
  )
  .describe('Additional arbitrary information attached to this transaction')

// Signer inner object schema
export const xrplSignerSchema = z.object({
  Account: z.string().describe('Address associated with this signature, as it appears in the signer list'),
  TxnSignature: z.string().describe('Hex signature for this transaction, verifiable using the SigningPubKey'),
  SigningPubKey: z.string().describe('Hex public key used to create this signature'),
})

// Signers wrapper schema
export const xrplSignersSchema = z
  .array(
    z.object({
      Signer: xrplSignerSchema,
    }),
  )
  .describe('Multi-signature entries authorizing this transaction (up to 32)')

export const xrplCommonFieldsSchema = z.object({
  // Required (by protocol) but often auto-filled by server if using submitAndWait with autofill
  Account: z.string().describe('The account that initiated the transaction (r-address)'),
  TransactionType: z.string().describe('The type of transaction (e.g., Payment, TrustSet, OfferCreate, etc.)'),

  // Common optional / auto-fillable fields
  Fee: z.string().optional().describe('Transaction cost in drops; typically auto-filled by the server'),
  Sequence: z.number().optional().describe('Account sequence number; typically auto-filled; 0 when using a Ticket'),
  LastLedgerSequence: z.number().optional().describe('Highest ledger index this transaction can appear in'),
  Flags: z.number().optional().describe('Bit-flags that affect how the transaction should behave'),

  // Optional fields
  AccountTxnID: z
    .string()
    .optional()
    .describe('Hash requiring the previous transaction of the sending account to match'),
  Delegate: z.string().optional().describe('Delegate account sending the transaction on behalf of Account'),
  SourceTag: z.number().optional().describe('Arbitrary integer used to identify a payment reason or sender'),
  TicketSequence: z
    .number()
    .optional()
    .describe('Sequence number of the Ticket to use in place of Sequence (Sequence must be 0)'),
  NetworkID: z
    .number()
    .optional()
    .describe('Chain network ID. MUST be omitted for networks with ID <= 1024; REQUIRED when ID >= 1025'),

  // Signing fields (usually added automatically by signing process)
  SigningPubKey: z
    .string()
    .optional()
    .describe('Hex public key; automatically added when signing (empty when multi-signing)'),
  TxnSignature: z.string().optional().describe('Hex signature; automatically added when signing'),

  // Structured arrays
  Memos: xrplMemosSchema.optional(),
  Signers: xrplSignersSchema.optional(),
})

export type XrplCommonFields = z.infer<typeof xrplCommonFieldsSchema>
