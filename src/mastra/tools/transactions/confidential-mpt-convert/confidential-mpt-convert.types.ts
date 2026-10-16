import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * ConfidentialMPTConvert-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/confidentialmptconvert
 */
export const xrplConfidentialMPTConvertFieldsSchema = z.object({
  MPTokenIssuanceID: z.string().describe('Hex ID of the MPT issuance'),
  MPTAmount: z.string().describe('Public amount to convert to confidential (integer string)'),
  BlindingFactor: z.string().describe('32-byte scalar (hex) used to encrypt the amount'),
  HolderEncryptedAmount: z.string().describe('66-byte ciphertext (hex) for the holder inbox'),
  IssuerEncryptedAmount: z.string().describe('66-byte ciphertext (hex) for the issuer mirror balance'),
  AuditorEncryptedAmount: z
    .string()
    .optional()
    .describe('66-byte ciphertext (hex). Required iff the issuance has an auditor key'),
  HolderEncryptionKey: z
    .string()
    .optional()
    .describe('Holder ElGamal public key (hex). Only on first conversion; omit once registered'),
  ZKProof: z.string().optional().describe('64-byte Schnorr proof (hex). Required with HolderEncryptionKey'),
})

export const xrplConfidentialMPTConvertSchema = xrplCommonFieldsSchema
  .merge(xrplConfidentialMPTConvertFieldsSchema)
  .extend({ TransactionType: z.literal('ConfidentialMPTConvert') })

export type XrplConfidentialMPTConvertFields = z.infer<typeof xrplConfidentialMPTConvertFieldsSchema>
export type XrplConfidentialMPTConvert = z.infer<typeof xrplConfidentialMPTConvertSchema>
