import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * ConfidentialMPTConvertBack-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/confidentialmptconvertback
 */
export const xrplConfidentialMPTConvertBackFieldsSchema = z.object({
  MPTokenIssuanceID: z.string().describe('Hex ID of the MPT issuance'),
  MPTAmount: z.string().describe('Amount to credit to the public balance (integer string, > 0)'),
  BlindingFactor: z.string().describe('32-byte scalar (hex) used to encrypt the amount'),
  HolderEncryptedAmount: z.string().describe('66-byte ciphertext (hex) subtracted from the holder spending balance'),
  IssuerEncryptedAmount: z.string().describe('66-byte ciphertext (hex) subtracted from the issuer mirror balance'),
  AuditorEncryptedAmount: z
    .string()
    .optional()
    .describe('66-byte ciphertext (hex). Required iff the issuance has an auditor key'),
  BalanceCommitment: z.string().describe('33-byte commitment (hex) to the spending balance'),
  ZKProof: z.string().describe('816-byte proof bundle (hex)'),
})

export const xrplConfidentialMPTConvertBackSchema = xrplCommonFieldsSchema
  .merge(xrplConfidentialMPTConvertBackFieldsSchema)
  .extend({ TransactionType: z.literal('ConfidentialMPTConvertBack') })

export type XrplConfidentialMPTConvertBackFields = z.infer<typeof xrplConfidentialMPTConvertBackFieldsSchema>
export type XrplConfidentialMPTConvertBack = z.infer<typeof xrplConfidentialMPTConvertBackSchema>
