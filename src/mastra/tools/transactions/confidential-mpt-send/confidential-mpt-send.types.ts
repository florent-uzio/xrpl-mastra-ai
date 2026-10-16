import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * ConfidentialMPTSend-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/confidentialmptsend
 */
export const xrplConfidentialMPTSendFieldsSchema = z.object({
  MPTokenIssuanceID: z.string().describe('Hex ID of the MPT issuance'),
  Destination: xrplAddressSchema.describe('Receiver (r-address); not the issuer or the sender'),
  DestinationTag: z.number().optional().describe('Destination tag'),
  SenderEncryptedAmount: z.string().describe('Ciphertext (hex) debited from the sender spending balance'),
  DestinationEncryptedAmount: z.string().describe('Ciphertext (hex) credited to the receiver inbox'),
  IssuerEncryptedAmount: z.string().describe('Ciphertext (hex) for the issuer mirror balance'),
  AuditorEncryptedAmount: z
    .string()
    .optional()
    .describe('Ciphertext (hex). Required iff the issuance has an auditor key, else omit'),
  AmountCommitment: z.string().describe('Commitment (hex) to the transfer amount'),
  BalanceCommitment: z.string().describe('Commitment (hex) to the sender spending balance'),
  ZKProof: z.string().describe('946-byte proof bundle (hex)'),
  CredentialIDs: z.array(z.string()).optional().describe('Credential IDs authorizing the sender; no duplicates'),
})

export const xrplConfidentialMPTSendSchema = xrplCommonFieldsSchema
  .merge(xrplConfidentialMPTSendFieldsSchema)
  .extend({ TransactionType: z.literal('ConfidentialMPTSend') })

export type XrplConfidentialMPTSendFields = z.infer<typeof xrplConfidentialMPTSendFieldsSchema>
export type XrplConfidentialMPTSend = z.infer<typeof xrplConfidentialMPTSendSchema>
