import { convertStringToHex } from 'xrpl'

/**
 * A 3-character code, or a 40-character hex code, is returned as is. Any other code is converted to hex and padded
 * to 40 characters. Throws for a code over 20 bytes, which no currency field can hold.
 */
export const currencyCodeToHex = (str: string) => {
  if (str.length === 3 || /^[0-9A-Fa-f]{40}$/.test(str)) {
    return str
  }

  const hex = convertStringToHex(str)
  if (hex.length > 40) {
    throw new Error(`Currency code "${str}" is longer than 20 bytes`)
  }

  return hex.padEnd(40, '0')
}
