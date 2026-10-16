import z from 'zod'
import { xrplAddressSchema, xrplDecimalValueSchema } from '../../../../helpers'

/**
 * Issued currency amount object (tokens only; XRP is a string of drops)
 * Reference: https://xrpl.org/docs/references/protocol/data-types/basic-data-types#specifying-currency-amounts
 */
export const xrplCurrencyAmountSchema = z.object({
  currency: z
    .string()
    .describe(
      'Currency code: 3-letter ISO 4217 code or longer custom code (converted to 160-bit hex automatically). "XRP" is not valid here. Examples: "USD", "RLUSD"',
    ),
  value: xrplDecimalValueSchema.describe('Quoted decimal amount, e.g. "100" or "0.5"'),
  issuer: xrplAddressSchema.describe('Address of the token issuer (r-address)'),
})
