import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'
import { xrplHexBlobSchema } from '../shared/transaction-fields'

/**
 * One entry of the PriceDataSeries array
 */
export const xrplPriceDataSchema = z.object({
  PriceData: z.object({
    BaseAsset: z
      .string()
      .describe('The asset to be priced: a currency code, converted to hex automatically (e.g. "XRP", "RLUSD")'),
    QuoteAsset: z
      .string()
      .describe('The asset in which the price is quoted: a currency code, converted to hex automatically (e.g. "USD")'),
    AssetPrice: z
      .union([
        z.number().int().gte(0).lte(Number.MAX_SAFE_INTEGER),
        // zod runs the refine even when the regex fails, so it checks the digits again before BigInt
        z
          .string()
          .refine(
            value => /^\d+$/.test(value) && BigInt(value) < 2n ** 64n,
            'Must be a decimal integer that fits in 64 bits (not hex)',
          ),
      ])
      .optional()
      .describe(
        'The price of BaseAsset in QuoteAsset as a DECIMAL unsigned 64-bit integer (a number, or a decimal string above 2^53), scaled by Scale: price = AssetPrice * 10^-Scale. Ledger responses show AssetPrice in hex: convert it to decimal first. Required when adding a pair; omit when updating an existing pair to delete it from the oracle.',
      ),
    Scale: z
      .number()
      .int()
      .min(0)
      .max(10)
      .optional()
      .describe(
        'Scaling factor (0-10) applied to AssetPrice: price = AssetPrice * 10^-Scale. Required if AssetPrice is present.',
      ),
  }),
})

/**
 * OracleSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/oracleset#oracleset-fields
 */
export const xrplOracleSetFieldsSchema = z.object({
  // Required fields
  OracleDocumentID: z
    .number()
    .int()
    .gte(0)
    .describe(
      'Unique identifier (uint32) of this Oracle for the owning Account. Account + OracleDocumentID identify the Oracle.',
    ),
  LastUpdateTime: z
    .number()
    .int()
    .gte(0)
    .describe(
      'Time the data was last updated, in seconds since the UNIX Epoch (NOT the Ripple Epoch). Must be within 300 seconds of the ledger close time.',
    ),
  PriceDataSeries: z
    .array(xrplPriceDataSchema)
    .min(1)
    .max(10)
    .describe(
      'Array of 1 to 10 PriceData entries. Each pair (BaseAsset, QuoteAsset) must be unique. A single transaction can add, update or delete pairs, up to 10 per Oracle.',
    ),

  // Optional fields (required when creating the Oracle)
  Provider: xrplHexBlobSchema(256)
    .optional()
    .describe(
      'Hex-encoded identifier of the oracle data provider (e.g. "Chainlink"), up to 256 bytes. Required when creating the Oracle; cannot be changed afterwards.',
    ),
  URI: xrplHexBlobSchema(256)
    .optional()
    .describe('Hex-encoded URI with additional info about the Oracle, up to 256 bytes'),
  AssetClass: xrplHexBlobSchema(16)
    .optional()
    .describe(
      'Hex-encoded type of assets the Oracle prices (e.g. "currency", "commodity", "equity"), up to 16 bytes. Required when creating the Oracle; cannot be changed afterwards.',
    ),
})

/**
 * Complete OracleSet transaction schema (requires the PriceOracle amendment)
 */
export const xrplOracleSetSchema = xrplCommonFieldsSchema
  .merge(xrplOracleSetFieldsSchema)
  .extend({ TransactionType: z.literal('OracleSet') })

export type XrplOracleSetFields = z.infer<typeof xrplOracleSetFieldsSchema>
export type XrplOracleSet = z.infer<typeof xrplOracleSetSchema>
