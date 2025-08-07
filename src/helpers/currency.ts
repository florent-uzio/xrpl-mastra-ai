import { convertHexToString, convertStringToHex } from 'xrpl'

// Convert hex to string
export const hexToString = (hex: string) => {
  return convertHexToString(hex)
}

// If the string is 3 characters long, return it as is
// Otherwise, convert it to hex
export const currencyStringToHex = (str: string) => {
  if (str.length === 3) {
    return str
  }

  return convertStringToHex(str).padEnd(40, '0')
}
