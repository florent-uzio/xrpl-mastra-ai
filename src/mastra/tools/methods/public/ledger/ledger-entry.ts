import { createTool } from '@mastra/core/tools'
import { Request } from 'xrpl'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getLedgerEntryTool = createTool({
  id: 'get-ledger-entry',
  description: `Fetch ONE raw ledger entry. Identify it with exactly one selector in request: the 64-hex "index" (object ID), or a typed selector such as account_root, check, escrow, offer, ripple_state, payment_channel, nft_page, amm, did, oracle, vault, mpt_issuance, mptoken, ticket, deposit_preauth, credential, directory. Examples: { account_root: "r..." }, { offer: { account: "r...", seq: 5 } }, { ripple_state: { accounts: ["r1","r2"], currency: "USD" } }, { escrow: { owner: "r...", seq: 7 } }, { vault: "<VaultID>" }, { mpt_issuance: "<MPTIssuanceID>" }. Set binary true for a hex blob.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.looseObject({
      index: z.string().length(64).optional().describe('64-character hex ID of the ledger entry'),
      binary: z.boolean().optional().describe('Return the entry as a hex blob'),
      account_root: xrplAddressSchema.optional().describe('AccountRoot entry of this account'),
      check: z.string().length(64).optional().describe('Check ID'),
      nft_page: z.string().length(64).optional().describe('NFT page ID'),
      amm: z.unknown().optional().describe('{ asset, asset2 } of the AMM'),
      ...ledgerSpecifierShape,
    }),
  }),
  outputSchema: xrplMethodResponse({
    index: z.string().optional(),
    node: z.looseObject({}).optional().describe('The ledger entry (JSON form)'),
    node_binary: z.string().optional().describe('The ledger entry (hex form, when binary is true)'),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'ledger_entry' } as Request,
      logMessage: 'Ledger entry request',
      mastra,
    })
  },
})
