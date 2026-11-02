import { z } from 'zod'
import { ledgerSpecifierShape, xrplAddressSchema } from '../../../../../helpers'
import { xrplAssetSchema } from '../../../transactions/shared'
import { defineMethodTool } from '../../shared'

export const getAmmInfoTool = defineMethodTool({
  id: 'get-amm-info',
  command: 'amm_info',
  description: `Get an Automated Market Maker (AMM) pool: both asset balances, LP token supply, trading fee, vote slots and auction slot. Identify the pool either by its two assets (asset and asset2) or by amm_account (the AMM's pseudo-account). Optionally pass account to see that account's LP token balance. Assets are { currency: "XRP" }, { currency, issuer } or { mpt_issuance_id }.`,
  request: z.object({
    asset: xrplAssetSchema.optional().describe('First asset of the pool'),
    asset2: xrplAssetSchema.optional().describe('Second asset of the pool'),
    amm_account: xrplAddressSchema.optional().describe('AMM pseudo-account (alternative to asset + asset2)'),
    account: xrplAddressSchema.optional().describe("Also return this account's LP token holdings"),
    ...ledgerSpecifierShape,
  }),
  result: {
    amm: z
      .looseObject({
        account: z.string().optional().describe('AMM pseudo-account'),
        amount: z.unknown().optional(),
        amount2: z.unknown().optional(),
        lp_token: z.unknown().optional(),
        trading_fee: z.number().optional().describe('In units of 1/100,000 (500 = 0.5%)'),
        vote_slots: z.array(z.unknown()).optional(),
        auction_slot: z.unknown().optional(),
      })
      .optional(),
  },
})
