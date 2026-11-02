import { z } from 'zod'
import { ledgerSpecifierShape, paginationMarkerSchema, xrplAddressSchema } from '../../../../../helpers'
import { defineMethodTool } from '../../shared'

export const getAccountNFTsTool = defineMethodTool({
  id: 'get-account-nfts',
  command: 'account_nfts',
  description: `List the NFTs owned by an account.

URI is returned hex-encoded; decode it to read it.`,
  request: z.object({
    account: xrplAddressSchema.describe('Account address'),
    ...ledgerSpecifierShape,
    limit: z
      .number()
      .int()
      .min(20)
      .max(400)
      .optional()
      .describe('Max results per page (20-400, default 100). Counts NFToken pages (up to 32 NFTs each), not NFTs.'),
    marker: paginationMarkerSchema,
  }),
  result: {
    account: z.string().optional(),
    account_nfts: z
      .array(
        z.looseObject({
          NFTokenID: z.string(),
          Issuer: z.string(),
          NFTokenTaxon: z.number(),
          URI: z.string().optional().describe('Hex-encoded'),
          Flags: z.number(),
        }),
      )
      .optional(),
  },
})
