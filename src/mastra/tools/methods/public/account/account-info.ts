import { createTool } from '@mastra/core/tools'
import { AccountInfoRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getAccountInfoTool = createTool({
  id: 'get-account-info',
  description: `Retrieve information about an account, its activity, and its XRP balance. All information retrieved is relative to a particular version of the ledger.

Request Parameters:
- account: The account to look up (string - address, required)
- ledger_hash: The unique hash of the ledger version to use (string, optional)
- ledger_index: The ledger index to use, or shortcut string like "current", "validated" (number or string, optional)
- queue: If true, return stats about queued transactions sent by this account (boolean, optional)
  - Can only be used when querying for data from the current open ledger
  - Not available from servers in Reporting Mode
- signer_lists: If true, return any SignerList objects associated with this account (boolean, optional)

Note: The following fields are deprecated and should not be provided: ident, ledger, strict.

The response includes:
- account_data: The AccountRoot ledger object with this account's information, containing:
  - Account: The account address (string)
  - Balance: The account's XRP balance in drops (string)
  - Flags: Account flags as a number (number)
  - LedgerEntryType: Always "AccountRoot" (string)
  - OwnerCount: Number of objects this account owns in the ledger (number)
  - PreviousTxnID: Hash of the previous transaction that affected this account (string)
  - PreviousTxnLgrSeq: Ledger sequence of the previous transaction (number)
  - Sequence: The current sequence number for this account (number)
  - index: The unique identifier for this account object (string)
- account_flags: The account's flag statuses based on the Flags field (object, optional)
  - defaultRipple: If true, account allows rippling on trust lines by default (boolean)
  - depositAuth: If true, account uses Deposit Authorization (boolean)
  - disableMasterKey: If true, account's master key pair is disabled (boolean)
  - disallowIncomingCheck: If true, account doesn't allow others to send Checks (boolean)
  - disallowIncomingNFTokenOffer: If true, account doesn't allow NFT buy/sell offers (boolean)
  - disallowIncomingPayChan: If true, account doesn't allow Payment Channels (boolean)
  - disallowIncomingTrustline: If true, account doesn't allow trust lines (boolean)
  - disallowIncomingXRP: If true, account doesn't want to receive XRP (boolean)
  - globalFreeze: If true, all tokens issued by account are frozen (boolean)
  - noFreeze: If true, account has permanently given up freeze abilities (boolean)
  - passwordSpent: If false, account can send key reset transaction (boolean)
  - requireAuthorization: If true, account uses Authorized Trust Lines (boolean)
  - requireDestinationTag: If true, account requires destination tag on payments (boolean)
- signer_lists: Array of SignerList objects for Multi-Signing (array, optional)
- ledger_current_index: The ledger index of the current in-progress ledger (integer, optional)
- ledger_index: The ledger index of the ledger version used (integer, optional)
- queue_data: Information about queued transactions (object, optional, only if queue=true)
  - txn_count: Number of queued transactions from this address (integer)
  - auth_change_queued: Whether a transaction changes authorization methods (boolean, optional)
  - lowest_sequence: Lowest sequence number among queued transactions (integer, optional)
  - highest_sequence: Highest sequence number among queued transactions (integer, optional)
  - max_spend_drops_total: Maximum XRP drops that could be debited from queued transactions (string, optional)
  - transactions: Array of queued transaction information (array, optional)
    - auth_change: Whether transaction changes authorization methods (boolean)
    - fee: Transaction cost in drops (string)
    - fee_level: Transaction cost relative to minimum cost (string)
    - max_spend_drops: Maximum XRP drops this transaction could send/destroy (string)
    - seq: Sequence number of this transaction (integer)
- validated: Whether this data is from a validated ledger version (boolean)

Important Notes:
- Balance is returned in drops and needs conversion to XRP (1 XRP = 1,000,000 drops)
- Account flags provide detailed information about account settings and restrictions
- Queue data is only available when querying the current open ledger
- Signer lists are only returned if requested and the account has multi-signing enabled
- The validated field indicates whether the data is final or subject to change

Possible Errors:
- invalidParams: One or more fields are specified incorrectly, or one or more required fields are missing
- actNotFound: The address specified in the account field does not correspond to an account in the ledger
- lgrNotFound: The ledger specified by ledger_hash or ledger_index does not exist, or the server doesn't have it
- Any of the universal error types`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<AccountInfoRequest>(),
  }),
  execute: async ({ context, mastra }) => {
    // Extract network and request from the context
    const { network, request } = context

    // Use the shared utility function to execute the account_info command
    return await executeMethod({
      network,
      request: { ...request, command: 'account_info' },
      logMessage: 'Account info request',
      mastra,
    })
  },
})
