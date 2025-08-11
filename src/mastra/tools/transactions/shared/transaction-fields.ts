import z from 'zod'

/**
 * Currency amount object
 * Reference: https://xrpl.org/docs/references/protocol/data-types/basic-data-types#specifying-currency-amounts
 */
export const xrplCurrencyAmountSchema = z.object({
  currency: z
    .string()
    .describe(
      'The currency code (3-letter ISO 4217 or 160-bit hex if it is not a 3-letter ISO 4217 code). "XRP" is invalid for TrustSet. Examples: "USD", "EUR", "534F4C4F00000000000000000000000000000000"',
    ),
  value: z.string().describe('Quoted decimal representation of the limit to set on this trust line'),
  issuer: z.string().describe('The address of the account to extend trust to (r-address)'),
})
