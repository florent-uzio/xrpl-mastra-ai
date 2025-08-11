import { convertStringToHex } from 'xrpl'

// If the string is 3 characters long, return it as is
// Otherwise, convert it to hex
export const currencyCodeToHex = (str: string) => {
  if (str.length === 3 || str.length === 40) {
    return str
  }

  return convertStringToHex(str).padEnd(40, '0')
}
