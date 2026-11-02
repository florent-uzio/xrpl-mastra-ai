import { z } from 'zod'
import { ledgerSpecifierShape, xrplAddressSchema } from '../../../../../helpers'
import { defineMethodTool } from '../../shared'

export const getVaultInfoTool = defineMethodTool({
  id: 'get-vault-info',
  command: 'vault_info',
  description: `Get a single-asset vault (XLS-65) and its share (MPT) issuance: owner, pseudo-account, asset, total/available assets, withdrawal policy and shares outstanding. Identify the vault by vault_id, or by owner plus seq (the VaultCreate sequence).`,
  request: z.object({
    vault_id: z.string().length(64).optional().describe('VaultID (64 hex characters)'),
    owner: xrplAddressSchema.optional().describe('Vault owner (use with seq)'),
    seq: z.number().int().nonnegative().optional().describe("Sequence of the owner's VaultCreate (use with owner)"),
    ...ledgerSpecifierShape,
  }),
  result: {
    vault: z
      .looseObject({
        Owner: z.string().optional(),
        Account: z.string().optional().describe('Vault pseudo-account'),
        Asset: z.unknown().optional(),
        AssetsTotal: z.string().optional(),
        AssetsAvailable: z.string().optional(),
        ShareMPTID: z.string().optional(),
        shares: z.looseObject({}).optional().describe('Share MPTokenIssuance entry'),
      })
      .optional(),
  },
})
