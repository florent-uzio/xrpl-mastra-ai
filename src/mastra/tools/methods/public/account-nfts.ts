import { createTool } from '@mastra/core/tools'
import { AccountNFTsRequest, AccountNFTsResponse } from 'xrpl'
import { z } from 'zod'
import { mastra } from '../../..'
import { disconnectXrplClient, getXrplClient } from '../../../../helpers'

export const getAccountNFTsTool = createTool({
  id: 'get-account-nfts',
  description: `Get an XRP Ledger account's NFTs (Non-Fungible Tokens).

The response includes:
- account: The account that owns the list of NFTs (string)
- account_nfts: Array of NFT objects owned by the account, each containing:
  - Flags: Bit-map of boolean flags enabled for this NFToken (number)
  - Issuer: The account that issued this NFToken (string - address)
  - NFTokenID: The unique identifier of this NFToken, in hexadecimal (string)
  - NFTokenTaxon: The unscrambled version of this token's taxon (number)
  - URI: The URI data associated with this NFToken, in hexadecimal (string)
  - nft_serial: The token sequence number of this NFToken, unique for its issuer (number)
- ledger_hash: The identifying hash of the ledger used to generate this response (string, optional)
- ledger_index: The ledger index of the ledger used to generate this response (number, optional)
- ledger_current_index: The ledger index of the current in-progress ledger version (number, optional)
- validated: Whether the information comes from a validated ledger version (boolean)
- marker: Server-defined value for pagination, omitted when no additional pages (optional)

Note: The URI field contains hexadecimal data that may need to be decoded to access the actual URI content.`,
  inputSchema: z.object({
    network: z.string(),
    opts: z.custom<AccountNFTsRequest>(),
  }),
  execute: async ({ context }) => {
    const { network, opts } = context

    const accountInfo = await getAccountNFTs(network, opts)

    return accountInfo
  },
})

/**
 * Get account NFTs
 * @param network - The network to use
 * @param opts - The request options to use
 * @returns The account NFTs
 */
const getAccountNFTs = async (network: string, opts: AccountNFTsRequest): Promise<AccountNFTsResponse> => {
  const client = await getXrplClient(network)

  const logger = mastra.getLogger()

  logger.info('Account NFTs request', { url: client.url, opts: JSON.stringify(opts) })

  const response = await client.request({
    ...opts,
    command: 'account_nfts',
  })

  // Disconnect the client
  await disconnectXrplClient(network)

  return response
}
