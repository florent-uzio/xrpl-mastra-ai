import { z } from 'zod'

/** Classic XRPL address (r...), base58 without 0, O, I, l */
export const xrplAddressSchema = z
  .string()
  .regex(/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, 'Must be a classic XRPL address starting with "r"')

/** Websocket URL of the XRPL server to use */
export const networkSchema = z
  .string()
  .describe(
    'Websocket URL of the XRPL server, e.g. "wss://s.altnet.rippletest.net:51233" (testnet), "wss://s.devnet.rippletest.net:51233" (devnet), "wss://s2.ripple.com" (mainnet)',
  )

/** Decimal string used for XRPL amounts (no sign, optional fraction and exponent) */
export const xrplDecimalValueSchema = z
  .string()
  .regex(/^\d+(\.\d+)?([eE][+-]?\d+)?$/, 'Must be a non-negative decimal string, e.g. "10" or "0.5"')

/** Ledger selection shared by most read-only methods */
export const ledgerSpecifierShape = {
  ledger_index: z
    .union([z.number().int().nonnegative(), z.enum(['validated', 'current', 'closed'])])
    .optional()
    .describe('Ledger sequence number, or "validated" (default recommended), "current" or "closed"'),
  ledger_hash: z.string().length(64).optional().describe('64-character hex hash of the ledger to use'),
}

export const paginationMarkerSchema = z
  .unknown()
  .optional()
  .describe('Pagination marker copied unchanged from the previous response')
