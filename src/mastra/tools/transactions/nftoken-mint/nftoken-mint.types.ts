import { z } from 'zod'
import { xrplCurrencyAmountSchema } from '../shared'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * NFTokenMint flags that can be used to control NFT behavior
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/nftokenmint#nftokenmint-flags
 */
export const NFTokenMintFlagsSchema = z.enum([
  'tfBurnable', // 1 - Allow issuer to destroy the minted NFToken
  'tfOnlyXRP', // 2 - NFToken can only be bought/sold for XRP
  'tfTrustLine', // 4 - DEPRECATED: Auto-create trust lines for transfer fees
  'tfTransferable', // 8 - NFToken can be transferred to others
  'tfMutable', // 16 - URI field can be updated using NFTokenModify
])

export type NFTokenMintFlags = z.infer<typeof NFTokenMintFlagsSchema>

/**
 * NFTokenMint-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/nftokenmint#nftokenmint-fields
 */
export const xrplNFTokenMintFieldsSchema = z.object({
  // Required field
  NFTokenTaxon: z
    .number()
    .int()
    .gte(0)
    .describe(
      'An arbitrary taxon, or shared identifier, for a series or collection of related NFTs. To mint a series of NFTs, give them all the same taxon.',
    ),

  // Optional fields
  Issuer: z
    .string()
    .optional()
    .describe(
      'The issuer of the token, if the sender is issuing it on behalf of another account. Must be omitted if the sender is the issuer. If provided, the issuer must have NFTokenMinter set to the sender.',
    ),
  TransferFee: z
    .number()
    .int()
    .min(0)
    .max(50000)
    .optional()
    .describe(
      'Fee charged by the issuer for secondary sales of the NFToken. Valid range: 0-50000 (0.00% to 50.00% in 0.001% increments). Requires tfTransferable flag if provided.',
    ),
  URI: z
    .string()
    .max(512) // 256 bytes = 512 hex characters
    .optional()
    .describe(
      'Up to 256 bytes of arbitrary data encoded as hexadecimal. Typically a URI pointing to NFT data/metadata (HTTP, HTTPS, IPFS, magnet link, data URL, etc.).',
    ),
  Amount: z
    .union([z.string(), xrplCurrencyAmountSchema])
    .optional()
    .describe(
      'Amount expected or offered for the NFToken. Must be non-zero except for XRP (where zero means giving away for free).',
    ),
  Expiration: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe(
      'Time after which the offer is no longer active, in seconds since the Ripple Epoch. Requires Amount field to be specified.',
    ),
  Destination: z
    .string()
    .optional()
    .describe(
      'If present, indicates that this offer may only be accepted by the specified account. Requires Amount field to be specified.',
    ),
})

/**
 * Complete NFTokenMint transaction schema
 */
export const xrplNFTokenMintSchema = xrplCommonFieldsSchema
  .merge(xrplNFTokenMintFieldsSchema)
  .extend({ TransactionType: z.literal('NFTokenMint') })
//   .refine(
//     data => {
//       // Validate TransferFee requires tfTransferable flag
//       if (data.TransferFee !== undefined && data.TransferFee > 0) {
//         return data.Flags !== undefined && (data.Flags & 8) !== 0 // tfTransferable = 8
//       }
//       return true
//     },
//     {
//       message: 'TransferFee requires the tfTransferable flag to be enabled',
//       path: ['TransferFee'],
//     },
//   )
//   .refine(
//     data => {
//       // Validate Expiration requires Amount
//       if (data.Expiration !== undefined) {
//         return data.Amount !== undefined
//       }
//       return true
//     },
//     {
//       message: 'Expiration requires the Amount field to be specified',
//       path: ['Expiration'],
//     },
//   )
//   .refine(
//     data => {
//       // Validate Destination requires Amount
//       if (data.Destination !== undefined) {
//         return data.Amount !== undefined
//       }
//       return true
//     },
//     {
//       message: 'Destination requires the Amount field to be specified',
//       path: ['Destination'],
//     },
//   )
//   .refine(
//     data => {
//       // Validate Amount is non-zero (except for XRP)
//       if (data.Amount !== undefined) {
//         if (typeof data.Amount === 'string') {
//           // XRP amount - zero is allowed
//           return true
//         } else {
//           // Token amount - must be non-zero
//           return parseFloat(data.Amount.value) > 0
//         }
//       }
//       return true
//     },
//     {
//       message: 'Amount must be non-zero for non-XRP currencies',
//       path: ['Amount'],
//     },
//   )
//   .refine(
//     data => {
//       // Validate URI length (256 bytes = 512 hex characters)
//       if (data.URI !== undefined) {
//         return data.URI.length <= 512
//       }
//       return true
//     },
//     {
//       message: 'URI must be 256 bytes or less (512 hex characters)',
//       path: ['URI'],
//     },
//   )

export type XrplNFTokenMintFields = z.infer<typeof xrplNFTokenMintFieldsSchema>
export type XrplNFTokenMint = z.infer<typeof xrplNFTokenMintSchema>

/**
 * Helper function to convert NFTokenMint flag names to numeric values
 */
export const getNFTokenMintFlagValue = (flagName: NFTokenMintFlags): number => {
  const flagValues: Record<NFTokenMintFlags, number> = {
    tfBurnable: 1,
    tfOnlyXRP: 2,
    tfTrustLine: 4,
    tfTransferable: 8,
    tfMutable: 16,
  }
  return flagValues[flagName]
}

/**
 * Helper function to validate NFTokenMint flags
 */
export const validateNFTokenMintFlags = (flags: number): boolean => {
  // Check for invalid flag combinations
  const validFlags = 1 | 2 | 4 | 8 | 16 // All valid flags combined

  // Check if any invalid flags are set
  if ((flags & ~validFlags) !== 0) {
    return false
  }

  return true
}

/**
 * Helper function to calculate transfer fee percentage
 */
export const calculateTransferFeePercentage = (transferFee: number): number => {
  return (transferFee / 1000000) * 100
}
