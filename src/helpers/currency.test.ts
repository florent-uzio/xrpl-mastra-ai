import { describe, expect, it } from 'vitest'
import { currencyCodeToHex } from './currency'

const RLUSD = '524C555344000000000000000000000000000000'

describe('currencyCodeToHex', () => {
  it('keeps 3-character codes and 40-character hex codes', () => {
    expect(currencyCodeToHex('USD')).toBe('USD')
    expect(currencyCodeToHex(RLUSD)).toBe(RLUSD)
  })

  it('encodes longer codes to 40 hex characters', () => {
    expect(currencyCodeToHex('RLUSD')).toBe(RLUSD)
  })

  it('rejects a 40-character code that is not hex instead of passing it through', () => {
    expect(() => currencyCodeToHex('X'.repeat(40))).toThrow('20 bytes')
  })

  it('rejects a code longer than 20 bytes', () => {
    expect(() => currencyCodeToHex('A_VERY_LONG_TOKEN_NAME')).toThrow('20 bytes')
  })
})
