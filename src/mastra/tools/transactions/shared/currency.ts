import { createTool } from '@mastra/core/tools'
import { convertHexToString } from 'xrpl'
import { z } from 'zod'
import { currencyCodeToHex } from '../../../../helpers'

export const currencyCodeToHexTool = createTool({
  id: 'currency-code-to-hex',
  description: `Convert a currency code to the 160-bit (40 hex characters) format used by XRPL transactions. Codes of 3 characters or a 40-character hex value are returned unchanged; longer codes are hex-encoded and zero-padded. Example: "RLUSD" becomes "524C555344000000000000000000000000000000".`,
  inputSchema: z.object({
    currency: z.string().min(1).max(40).describe('Currency code, e.g. "USD" or "RLUSD"'),
  }),
  outputSchema: z.string().describe('3-character code or 40-character hex code'),
  execute: async inputData => {
    return currencyCodeToHex(inputData.currency)
  },
})

export const hexToCurrencyCodeTool = createTool({
  id: 'hex-to-currency-code',
  description: `Convert a 40-character hex currency code from an XRPL response to readable text, trimming zero padding. 3-character codes are returned unchanged. Example: "524C555344000000000000000000000000000000" becomes "RLUSD".`,
  inputSchema: z.object({
    hex: z.string().min(3).max(40).describe('Currency code from a response: 3 characters or 40 hex characters'),
  }),
  outputSchema: z.string().describe('Readable currency code'),
  execute: async inputData => {
    const { hex } = inputData

    if (hex.length === 3) {
      return hex
    }

    return convertHexToString(hex).replace(/\0+$/, '')
  },
})
