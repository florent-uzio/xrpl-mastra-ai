import { createTool } from '@mastra/core/tools'
import { AccountObjectsRequest, AccountObjectsResponse } from 'xrpl'
import { z } from 'zod'
import { mastra } from '../../../..'
import { disconnectXrplClient, getXrplClient } from '../../../../../helpers'

export const getAccountObjectsTool = createTool({
  id: 'get-account-objects',
  description: `Get an XRP Ledger account's raw ledger format objects. This method returns the raw ledger format for all ledger entries owned by an account.

Request Parameters:
- account: A unique identifier for the account, most commonly the account's Address (string, required)
- amount: The amount to be delivered by the held payment (object or string, optional)
- deletion_blockers_only: If true, only includes objects that would block account deletion (boolean, optional, default: false)
- ledger_hash: The unique hash of the ledger version to use (string, optional)
- ledger_index: The ledger index to use, or shortcut string like "validated" (string or number, optional)
- limit: Maximum number of objects to include (number, optional, range: 10-400, default: 200)
- marker: Value from previous paginated response for resuming (optional)
- transfer_rate: Fee to charge when users finish an escrow (number, optional)
- type: Filter results to specific ledger entry type (string, optional)

Valid 'type' field values (case insensitive):
- bridge: Bridge entries for cross-chain bridges (requires XChainBridge amendment)
- check: Check entries for pending Checks
- deposit_preauth: DepositPreauth entries for deposit preauthorizations
- escrow: Escrow entries for held payments not yet executed or canceled
- mptoken: MPToken entries (requires MPToken amendment)
- nft_offer: NFTokenOffer entries for offers to buy or sell an NFT
- nft_page: NFTokenPage entries for collections of NFTs
- offer: Offer entries for live, unfunded, or expired orders
- payment_channel: PayChannel entries for open payment channels
- state: RippleState entries for trust lines where account's side is not in default state
- signer_list: SignerList entries if account has multi-signing enabled
- ticket: Ticket entries for Tickets

The response includes:
- account: Unique address of the account this request corresponds to (string)
- account_objects: Array of objects owned by this account, each in raw ledger format. Object types include:
  - Bridge entries for cross-chain bridges (requires XChainBridge amendment)
  - Check entries for pending Checks
  - DepositPreauth entries for deposit preauthorizations
  - Escrow entries for held payments not yet executed or canceled
  - NFTokenOffer entries for offers to buy or sell an NFT
  - NFTokenPage entries for collections of NFTs
  - Offer entries for live, unfunded, or expired orders
  - PayChannel entries for open payment channels
  - RippleState entries for trust lines where this account's side is not in default state
  - SignerList entries if the account has multi-signing enabled
  - Ticket entries for Tickets

Each object contains ledger-specific fields such as:
- LedgerEntryType: The type of ledger entry (string)
- index: Unique identifier for this ledger entry (string)
- Flags: Bit-map of boolean flags (number)
- PreviousTxnID: ID of the transaction that last modified this object (string)
- PreviousTxnLgrSeq: Ledger sequence of the transaction that last modified this object (number)
- Additional fields specific to each object type (Balance, Limits, etc.)

- ledger_hash: The identifying hash of the ledger used to generate this response (string, optional)
- ledger_index: The ledger index of the ledger version used to generate this response (number, optional)
- ledger_current_index: The ledger index of the current in-progress ledger version (number, optional)
- limit: The limit that was used in this request, if any (number, optional)
- marker: Server-defined value for pagination, omitted when no additional pages (optional)
- validated: Whether the information comes from a validated ledger version (boolean)

Note: For a higher-level view of an account's trust lines and balances, see the account_lines method instead.`,
  inputSchema: z.object({
    network: z.string(),
    opts: z.custom<AccountObjectsRequest>(),
  }),
  execute: async ({ context }) => {
    const { network, opts } = context

    const accountInfo = await getAccountObjects(network, opts)

    return accountInfo
  },
})

/**
 * Get account Objects
 * @param network - The network to use
 * @param opts - The request options to use
 * @returns The account objects
 */
const getAccountObjects = async (network: string, opts: AccountObjectsRequest): Promise<AccountObjectsResponse> => {
  const client = await getXrplClient(network)

  const logger = mastra.getLogger()

  logger.info('Account objects request', { url: client.url, opts: JSON.stringify(opts) })

  const response = await client.request({
    ...opts,
    command: 'account_objects',
  })

  // Disconnect the client
  await disconnectXrplClient(network)

  return response
}
