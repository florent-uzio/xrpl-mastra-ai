import { createTool } from '@mastra/core/tools'
import { AccountNFTsRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getAccountNFTsTool = createTool({
  id: 'get-account-nfts',
  description: `Retrieve a list of NFToken objects for the specified account. This method returns all NFTs (Non-Fungible Tokens) owned by the account. Requires the NonFungibleTokensV1_1 amendment to be enabled.

Request Parameters:
- account: The unique identifier of an account, typically the account's address (string, required)
- ledger_hash: The unique hash of the ledger version to use (string, optional)
- ledger_index: The ledger index to use, or shortcut string like "validated" (string or number, optional)
- limit: Limit the number of token pages to retrieve (integer, optional, range: 20-400, default: 100)
  - Each page can contain up to 32 NFTs
  - Positive values outside the range are replaced with the closest valid option
- marker: Value from a previous paginated response for resuming (optional)

The response includes:
- account: The account that owns the list of NFTs (string)
- account_nfts: Array of NFTs owned by the account, each containing:
  - Flags: A bit-map of boolean flags enabled for this NFToken (number)
    - See NFToken Flags documentation for possible values
  - Issuer: The account that issued this NFToken (string - address)
  - NFTokenID: The unique identifier of this NFToken in hexadecimal (string)
  - NFTokenTaxon: The unscrambled version of this token's taxon (number)
    - Several tokens with the same taxon might represent instances of a limited series
  - URI: The URI data associated with this NFToken in hexadecimal (string)
    - This may need to be decoded from hex to get the actual URI
  - nft_serial: The token sequence number of this NFToken, unique for its issuer (number)
- ledger_hash: The identifying hash of the ledger used to generate this response (string, optional)
- ledger_index: The ledger index of the ledger used to generate this response (number, optional)
- ledger_current_index: The ledger index of the current in-progress ledger version (number, optional)
- validated: Whether this data comes from a validated ledger version (boolean)
- marker: Server-defined value for pagination, omitted when no additional pages (optional)

Important Notes:
- This method requires the NonFungibleTokensV1_1 amendment to be enabled
- Each NFToken page can contain up to 32 NFTs
- The limit parameter controls how many pages to retrieve (not individual NFTs)
- URI data is returned in hexadecimal format and may need decoding
- NFTokenTaxon helps identify tokens that are part of the same series
- The nft_serial is unique per issuer, not globally
- Pagination uses marker-based system for large NFT collections
- Flags indicate various properties and restrictions on the NFT

Possible Errors:
- invalidParams: One or more fields are specified incorrectly, or one or more required fields are missing
- actNotFound: The Address specified in the account field does not correspond to an account in the ledger
- lgrNotFound: The ledger specified by ledger_hash or ledger_index does not exist, or the server doesn't have it
- Any of the universal error types`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<AccountNFTsRequest>(),
  }),
  execute: async ({ context, mastra }) => {
    // Extract network and options from the context
    const { network, request } = context

    // Use the shared utility function to execute the account_nfts command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_nfts' },
      logMessage: 'Account NFTs request',
      mastra,
    })
  },
})
