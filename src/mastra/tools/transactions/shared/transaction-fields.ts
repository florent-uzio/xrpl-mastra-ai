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

/** 256-bit hash as 64 hex characters (ledger entry IDs such as VaultID, LoanBrokerID, LoanID) */
export const xrplHash256Schema = z.string().regex(/^[0-9A-Fa-f]{64}$/, 'Must be a 64-character hex string')

/** Hex-encoded blob (e.g. Data), limited to maxBytes bytes */
export const xrplHexBlobSchema = (maxBytes: number) =>
  z
    .string()
    .regex(/^([0-9A-Fa-f]{2})+$/, 'Must be a non-empty hex string with an even number of characters')
    .max(maxBytes * 2, `Must be ${maxBytes} bytes or less`)
