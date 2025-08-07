import { createTool } from '@mastra/core/tools'
import { convertHexToString, convertStringToHex } from 'xrpl'
import { z } from 'zod'

export const currencyCodeToHexTool = createTool({
  id: 'currency-code-to-hex',
  description: `Convert a currency code to a 160-bit hex value for use in XRPL transactions. This tool handles the conversion of human-readable currency codes to the hexadecimal format required by the XRP Ledger.

Input Parameters:
- currency: The currency code to convert (string, required)
  - Can be a standard 3-character ISO currency code (e.g., "USD", "EUR")
  - Can be a custom currency code with more than 3 characters
  - Currency codes are case-sensitive

Conversion Logic:
- If currency code is 3 characters or less: Returns the original currency code unchanged
- If currency code is more than 3 characters: Converts to 160-bit hex value
  - Uses convertStringToHex() from XRPL library
  - Pads the result to exactly 40 characters (160 bits) with trailing zeros
  - Example: "CUSTOM" becomes "434553544F4D0000000000000000000000000000"

Use Cases:
- Converting custom currency codes for TrustSet transactions
- Preparing currency codes for token issuance
- Standardizing currency code format for XRPL operations

Important Notes:
- Standard 3-character currency codes (USD, EUR, etc.) are returned unchanged
- Custom currency codes are converted to 40-character hex strings
- The resulting hex is always exactly 40 characters long
- This tool is essential for creating trust lines with custom currencies, handling DEX offers, NFT Offers, creating Payment Channels etc.`,
  inputSchema: z.object({
    currency: z.string(),
  }),
  execute: async ({ context }) => {
    const { currency } = context

    if (currency.length > 3) {
      return convertStringToHex(currency).padEnd(40, '0')
    }

    return currency
  },
})

export const hexToCurrencyCodeTool = createTool({
  id: 'hex-to-currency-code',
  description: `Convert a 160-bit hex value back to a human-readable currency code. This tool reverses the conversion process to make hex currency codes readable.

Input Parameters:
- hex: The 160-bit hex value to convert (string, required)
  - Should be a 40-character hexadecimal string
  - Can be shorter if it's a standard currency code
  - Example: "434553544F4D0000000000000000000000000000"

Conversion Logic:
- Uses convertHexToString() from XRPL library
- Converts the hex value to its original string representation
- May need to remove leading/trailing zeros for proper display

Use Cases:
- Reading currency codes from trust line responses
- Converting hex currency codes back to human-readable format
- Debugging and displaying currency information
- Processing account_lines and other XRPL responses

Important Notes:
- The LLM may need to remove leading/trailing zero bytes for proper display
- Some hex values may contain padding zeros that should be trimmed
- Standard 3-character currency codes are returned as-is
- Custom currency codes are converted from their hex representation
- Always verify the result makes sense in context

Example Conversions:
- "434553544F4D0000000000000000000000000000" → "CESTOM"
- "524C555344000000000000000000000000000000" → "RLUSD"`,
  inputSchema: z.object({
    hex: z.string(),
  }),
  execute: async ({ context }) => {
    const { hex } = context

    return convertHexToString(hex)
  },
})
