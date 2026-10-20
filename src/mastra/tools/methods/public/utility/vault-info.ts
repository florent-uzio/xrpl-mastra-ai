import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getVaultInfoTool = createTool({
  id: 'get-vault-info',
  description: `Get a single-asset vault (XLS-65) and its share (MPT) issuance: owner, pseudo-account, asset, total/available assets, withdrawal policy and shares outstanding. Identify the vault by vault_id, or by owner plus seq (the VaultCreate sequence).`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      vault_id: z.string().length(64).optional().describe('VaultID (64 hex characters)'),
      owner: xrplAddressSchema.optional().describe('Vault owner (use with seq)'),
      seq: z.number().int().nonnegative().optional().describe("Sequence of the owner's VaultCreate (use with owner)"),
      ...ledgerSpecifierShape,
    }),
  }),
  outputSchema: xrplMethodResponse({
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
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'vault_info' },
      logMessage: 'Vault info request',
      mastra,
    })
  },
})
