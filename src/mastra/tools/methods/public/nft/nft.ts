import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ledgerSpecifierShape, networkSchema, paginationMarkerSchema, xrplAddressSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getNftInfoTool = createTool({
  id: 'get-nft-info',
  description: `Get an NFT's details: owner, issuer, URI, flags, taxon, serial and whether it is burned. Clio servers only (e.g. wss://clio.altnet.rippletest.net:51233/, wss://honeycluster.io/); rippled does not support it.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      nft_id: z.string().length(64).describe('NFTokenID (64 hex characters)'),
      ...ledgerSpecifierShape,
    }),
  }),
  outputSchema: xrplMethodResponse({
    nft_id: z.string().optional(),
    owner: z.string().optional(),
    is_burned: z.boolean().optional(),
    flags: z.number().optional(),
    transfer_fee: z.number().optional(),
    issuer: z.string().optional(),
    nft_taxon: z.number().optional(),
    nft_serial: z.number().optional(),
    uri: z.string().optional().describe('Hex-encoded URI'),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'nft_info' },
      logMessage: 'NFT info request',
      mastra,
    })
  },
})

export const getNftHistoryTool = createTool({
  id: 'get-nft-history',
  description: `Get the transactions that affected an NFT (mint, transfers, offers, burn). Clio servers only.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      nft_id: z.string().length(64).describe('NFTokenID (64 hex characters)'),
      ledger_index_min: z.number().int().optional().describe('Earliest ledger to search'),
      ledger_index_max: z.number().int().optional().describe('Latest ledger to search'),
      binary: z.boolean().optional().describe('Return hex instead of JSON'),
      forward: z.boolean().optional().describe('Oldest first'),
      ...ledgerSpecifierShape,
      limit: z.number().int().positive().optional().describe('Max results per page'),
      marker: paginationMarkerSchema,
    }),
  }),
  outputSchema: xrplMethodResponse({
    nft_id: z.string().optional(),
    transactions: z.array(z.looseObject({ validated: z.boolean().optional() })).optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'nft_history' },
      logMessage: 'NFT history request',
      mastra,
    })
  },
})

export const getNftsByIssuerTool = createTool({
  id: 'get-nfts-by-issuer',
  description: `List the NFTs minted by an issuer, optionally only one taxon. Clio servers only. Use get-account-nfts for the NFTs an account owns.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      issuer: xrplAddressSchema.describe('Issuer address'),
      nft_taxon: z.number().int().nonnegative().optional().describe('Only this taxon'),
      ...ledgerSpecifierShape,
      limit: z.number().int().positive().optional().describe('Max results per page'),
      marker: paginationMarkerSchema,
    }),
  }),
  outputSchema: xrplMethodResponse({
    issuer: z.string().optional(),
    nfts: z.array(z.looseObject({ nft_id: z.string().optional() })).optional(),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    const { network, request } = inputData

    return await executeMethod({
      network,
      request: { ...request, command: 'nfts_by_issuer' },
      logMessage: 'NFTs by issuer request',
      mastra,
    })
  },
})
