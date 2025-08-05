import { createTool } from '@mastra/core/tools'
import { AccountSet } from 'xrpl'
import z from 'zod'
import { submitTransaction } from './shared'

export const submitAccountSetTool = createTool({
  id: 'submit-account-set',
  description: `Submit an AccountSet transaction to the XRPL network. An AccountSet transaction modifies the properties of an account in the XRPL, allowing you to configure various account settings, flags, and metadata.

## AccountSet Transaction Fields

### Optional Fields (All fields are optional):
- **Account**: The account to modify (string - address, required in transaction)
- **ClearFlag**: Unique identifier of a flag to disable (number, optional)
  - Use AccountSet flags (asf*) to disable account settings
  - Can disable up to one flag per transaction
- **SetFlag**: Integer flag to enable for this account (number, optional)
  - Use AccountSet flags (asf*) to enable account settings
  - Can enable up to one flag per transaction
- **Domain**: Domain that owns this account (string - hex, optional)
  - Represented as hex string of lowercase ASCII
  - Example: "example.com" becomes "6578616D706C652E636F6D"
  - Cannot be more than 256 bytes in length
  - Use empty string to remove domain
- **EmailHash**: Arbitrary 128-bit value (string, optional)
  - Conventionally used as MD5 hash of email for Gravatar
  - Can be any 128-bit value
- **MessageKey**: Public key for encrypted messages (string, optional)
  - Exactly 33 bytes for secp256k1 (0x02/0x03) or Ed25519 (0xED) keys
  - Use empty value to remove the key
- **NFTokenMinter**: Account that can mint NFTs for you (string - address, optional)
  - Requires NonFungibleTokensV1_1 amendment
  - Set ClearFlag to 10 (asfAuthorizedNFTokenMinter) to remove
- **TransferRate**: Fee for token transfers (number, optional)
  - Represented as billionths of a unit
  - Range: 1000000000 to 2000000000, or 0 for no fee
  - Example: 1200000000 = 20% fee (1.2x multiplier)
- **TickSize**: Significant digits for exchange rates (number, optional)
  - Valid values: 3 to 15 inclusive, or 0 to disable
  - Requires TickSize amendment
  - Affects offers involving currency issued by this account
- **WalletLocator**: Arbitrary 256-bit value (string, optional)
  - Stored with account but has no inherent meaning
  - Can be used for custom metadata
- **WalletSize**: Not used (number, optional)
  - Valid in AccountSet but does nothing
- **Fee**: Transaction cost in drops (string, optional)
- **Sequence**: Account sequence number (number, optional)
- **LastLedgerSequence**: Last ledger to process transaction (number, optional)

## AccountSet Flags (asf*)

| Flag Name | Value | Description |
|-----------|-------|-------------|
| asfAccountTxnID | 5 | Track the ID of this account's most recent transaction |
| asfAllowTrustLineClawback | 19 | Allow clawback of tokens from trust lines |
| asfAuthorizedNFTokenMinter | 10 | Authorize another account to mint NFTs for you |
| asfDefaultRipple | 8 | Enable rippling on trust lines by default |
| asfDepositAuth | 9 | Require authorization for incoming payments |
| asfDisableMaster | 4 | Disable the master key pair |
| asfDisallowIncomingCheck | 13 | Block incoming Check objects |
| asfDisallowIncomingNFTokenOffer | 12 | Block incoming NFTokenOffer objects |
| asfDisallowIncomingPayChan | 14 | Block incoming Payment Channels |
| asfDisallowIncomingTrustline | 15 | Block incoming trust lines |
| asfDisallowXRP | 3 | Discourage XRP payments to this account (advisory) |
| asfGlobalFreeze | 7 | Freeze all assets issued by this account |
| asfNoFreeze | 6 | Permanently give up freeze abilities (irreversible) |
| asfRequireAuth | 2 | Require authorization for users to hold issued balances |
| asfRequireDest | 1 | Require destination tag for incoming transactions |

## Transaction Flags (tf*)

| Flag Name | Hex Value | Decimal Value | Purpose |
|-----------|-----------|---------------|---------|
| tfRequireDestTag | 0x00010000 | 65536 | Require destination tag |
| tfOptionalDestTag | 0x00020000 | 131072 | Make destination tag optional |
| tfRequireAuth | 0x00040000 | 262144 | Require authorization |
| tfOptionalAuth | 0x00080000 | 524288 | Make authorization optional |
| tfDisallowXRP | 0x00100000 | 1048576 | Discourage XRP payments |
| tfAllowXRP | 0x00200000 | 2097152 | Allow XRP payments |

## Special Requirements

### Master Key Authorization
- **asfDisableMaster** and **asfNoFreeze** require master key signature
- Cannot use regular key pair or multi-signature for these flags
- **asfDisableMaster** can be disabled using regular key or multi-signature

### Authorization Requirements
- **asfRequireAuth**: Can only be enabled if account has no trust lines
- **asfAuthorizedNFTokenMinter**: Requires NonFungibleTokensV1_1 amendment
- **asfDisallowIncoming***: Requires DisallowIncoming amendment

## Domain Configuration

### Setting Domain
- Convert domain to lowercase ASCII, then to hex
- Example: "example.com" → "6578616D706C652E636F6D"
- Maximum 256 bytes in length
- Use empty string to remove domain

### Two-Way Link
For domain verification:
1. Set domain in account's Domain field
2. Host xrp-ledger.toml file at that domain
3. List accounts you own in the toml file

## TransferRate Configuration

### Fee Calculation
- TransferRate = amount sent for 1 billion units to arrive
- Range: 1000000000 (no fee) to 2000000000 (100% fee)
- 0 = shortcut for 1000000000 (no fee)

### Examples
- **1000000000**: No fee (1.0x multiplier)
- **1100000000**: 10% fee (1.1x multiplier)
- **1200000000**: 20% fee (1.2x multiplier)
- **2000000000**: 100% fee (2.0x multiplier)

## Blocking Incoming Transactions

### Protection Mechanisms
- **asfRequireDest**: Ensures all payments have destination tags
- **asfDisallowXRP**: Discourages XRP payments (advisory only)
- **asfDepositAuth**: Blocks all incoming payments unless below reserve
- **asfDisallowIncoming***: Blocks specific object types (requires amendment)

### Amendment-Dependent Features
- **DisallowIncoming amendment**: Enables blocking of Checks, NFTokenOffers, Payment Channels, and trust lines
- **NonFungibleTokensV1_1 amendment**: Enables NFTokenMinter functionality
- **TickSize amendment**: Enables TickSize configuration

## Example AccountSet Transactions

### Basic Account Configuration:
{
  "TransactionType": "AccountSet",
  "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
  "Domain": "6578616D706C652E636F6D",
  "SetFlag": 8,
  "Fee": "12"
}

### Enable Deposit Authorization:
{
  "TransactionType": "AccountSet",
  "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
  "SetFlag": 9,
  "Fee": "12"
}

### Set Transfer Rate:
{
  "TransactionType": "AccountSet",
  "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
  "TransferRate": 1200000000,
  "Fee": "12"
}

### Disable Master Key:
{
  "TransactionType": "AccountSet",
  "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
  "SetFlag": 4,
  "Fee": "12"
}

### Authorize NFT Minter:
{
  "TransactionType": "AccountSet",
  "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
  "SetFlag": 10,
  "NFTokenMinter": "rMinterAccountAddressHere",
  "Fee": "12"
}

## Important Notes:

### Flag Behavior
- All flags are disabled by default
- Can enable/disable up to one flag per transaction
- Some flags are irreversible (asfNoFreeze)
- Master key required for asfDisableMaster and asfNoFreeze
- It is possible to combine multiple flags in a single transaction using the Flags and SetFlag fields.
- If required, multiple transactions can be used to set multiple flags.
- If you need to set multiple flags, you can use the Flags field to set multiple flags in a single transaction as long as the flags start with tf*.
- If you need to set multiple flags, you can use the SetFlag field to set multiple flags in a single transaction. Those flags must start with asf*.
- If you need to set multiple flags, you can use the ClearFlag field to set multiple flags in a single transaction. Those flags must start with asf*.

### Security Considerations
- **asfDisableMaster**: Permanently disables master key (use with caution)
- **asfNoFreeze**: Permanently gives up freeze abilities (irreversible)
- **asfDepositAuth**: Blocks all incoming payments unless below reserve
- **asfRequireAuth**: Requires authorization for issued tokens

### Amendment Dependencies
- **DisallowIncoming**: Enables blocking specific object types
- **NonFungibleTokensV1_1**: Enables NFT minting authorization
- **TickSize**: Enables exchange rate precision control

### Error Conditions
- **tecNO_PERMISSION**: Cannot enable flag due to account state
- **tecINSUFFICIENT_RESERVE**: Account below reserve requirement
- **tecMASTER_DISABLED**: Master key disabled but required for operation`,
  inputSchema: z.object({
    network: z.string(),
    txn: z.custom<AccountSet>().optional(),
    seed: z.string().optional(),
    signature: z.string().optional(),
  }),
  execute: async ({ context, mastra }) => {
    const { network, txn, seed, signature } = context

    if (txn && seed) {
      return await submitTransaction({ network, txn, seed, mastra })
    } else if (signature) {
      return await submitTransaction({ network, signature, mastra })
    }
  },
})
