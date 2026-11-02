import z from 'zod'
import { currencyCodeToHex, xrplAddressSchema } from '../../../../helpers'
import { xrplCurrencyAmountSchema } from './transaction-fields'

const mptIssuanceIdSchema = z.string().describe('MPT issuance ID (48 hex characters)')

/**
 * Asset definition without an amount: XRP, a trust line token or an MPT
 * Reference: https://xrpl.org/docs/references/protocol/data-types/currency-formats
 */
export const xrplAssetSchema = z.union([
  z.object({ currency: z.literal('XRP') }),
  z.object({
    currency: z.string().describe('Currency code (converted to 160-bit hex automatically), e.g. "USD", "RLUSD"'),
    issuer: xrplAddressSchema.describe('Address of the token issuer (r-address)'),
  }),
  z.object({ mpt_issuance_id: mptIssuanceIdSchema }),
])

/** An MPT amount: the issuance ID and a quoted integer */
export const xrplMptAmountSchema = z.object({
  mpt_issuance_id: mptIssuanceIdSchema,
  value: z.string().describe('Quoted integer amount'),
})

/** Asset with an amount: XRP in drops (string), a trust line token or an MPT */
export const xrplAssetAmountSchema = z.union([
  z.string().describe('XRP amount in drops, e.g. "1000000" = 1 XRP'),
  xrplCurrencyAmountSchema,
  xrplMptAmountSchema,
])

/** Converts the currency code of a token asset or amount to hex. XRP, MPT and drops strings are returned unchanged. */
export const encodeCurrencyCodes = <T>(value: T): T => {
  if (typeof value === 'object' && value !== null && 'currency' in value && typeof value.currency === 'string') {
    return { ...value, currency: currencyCodeToHex(value.currency) }
  }

  return value
}

/** Converts the currency code of every token asset or amount, at any depth, to hex. Safe to apply twice. */
export const encodeCurrencyCodesDeep = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(encodeCurrencyCodesDeep) as T
  }

  if (typeof value === 'object' && value !== null) {
    const encoded = Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, encodeCurrencyCodesDeep(entry)]),
    )
    return encodeCurrencyCodes(encoded) as T
  }

  return value
}
