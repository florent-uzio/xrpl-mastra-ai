import { createTool } from '@mastra/core/tools'
import { NFTokenMint } from 'xrpl'
import z from 'zod'
import { submitTransaction } from './shared'

export const submitNftokenMintTool = createTool({
  id: 'submit-nftoken-mint',
  description: `Submit an NFTokenMint transaction to the XRPL network. This transaction creates a non-fungible token (NFT) and adds it to the relevant NFTokenPage object of the NFTokenMinter as an NFToken object. This is the only opportunity to specify immutable token fields like TokenFlags.

**Requires the NonFungibleTokensV1_1 amendment to be enabled.**

## NFTokenMint Transaction Fields

### Required Fields:
- **Account**: The account sending the transaction (string - address, required)
- **NFTokenTaxon**: An arbitrary taxon/identifier for NFT series/collection (number, required)
  - Use same taxon for related NFTs in a series
  - Helps organize and group related NFTs
  - Use 0 if not provided by the user
### Optional Fields:
- **Issuer**: Account issuing the token on behalf of another (string - address, optional)
  - Required when minting for another account
  - Issuer's AccountRoot must have NFTokenMinter set to transaction sender
  - Omit if transaction sender is the issuer
- **TransferFee**: Fee for secondary sales (number, optional)
  - Range: 0 to 50000 inclusive
  - Represents 0.00% to 50.00% in 0.001% increments
  - Example: 25000 = 25% transfer fee
  - Requires tfTransferable flag if provided
- **URI**: Up to 256 bytes of arbitrary data (string - hex, optional)
  - Encoded as hexadecimal string
  - Points to NFT data or metadata
  - Can be HTTP/HTTPS URL, IPFS URI, magnet link, data URL, or custom encoding
  - Not validated for format or accessibility
  - Use xrpl.convertStringToHex() utility for conversion
- **Amount**: Expected/offered amount for the NFT (currency amount, optional)
  - Must be non-zero except for XRP (can be zero)
  - Zero XRP means giving away the token gratis
  - Required if Expiration or Destination is specified
- **Expiration**: Time after which offer is no longer active (number, optional)
  - In seconds since Ripple Epoch
  - Requires Amount field to be specified
- **Destination**: Account that can accept the offer (string - address, optional)
  - Restricts offer acceptance to specific account
  - Requires Amount field to be specified
- **Fee**: Transaction cost in drops (string, optional)
- **Sequence**: Account sequence number (number, optional)
- **LastLedgerSequence**: Last ledger to process transaction (number, optional)

## NFTokenMint Flags

| Flag Name | Hex Value | Decimal Value | Description |
|-----------|-----------|---------------|-------------|
| tfBurnable | 0x00000001 | 1 | Allow issuer/authorized entity to destroy the minted NFToken (owner can always do so) |
| tfOnlyXRP | 0x00000002 | 2 | NFToken can only be bought/sold for XRP (useful when issuer doesn't want fees in other currencies) |
| tfTrustLine | 0x00000004 | 4 | **DEPRECATED** Automatically create trust lines for transfer fees (invalid with fixRemoveNFTokenAutoTrustLine amendment) |
| tfTransferable | 0x00000008 | 8 | NFToken can be transferred to others (if not enabled, only issuer transfers allowed) |
| tfMutable | 0x00000010 | 16 | URI field can be updated using NFTokenModify transaction |

## Flag Combinations and Usage

### Common Flag Combinations:
- **Basic Transferable NFT**: Flags: 8 (tfTransferable only)
- **Transferable with Transfer Fee**: Flags: 8 + TransferFee: 25000 (25% fee)
- **Burnable and Transferable**: Flags: 9 (tfBurnable + tfTransferable)
- **XRP-Only Transferable**: Flags: 10 (tfOnlyXRP + tfTransferable)
- **Mutable Transferable**: Flags: 24 (tfMutable + tfTransferable)
- **Complete Control**: Flags: 25 (tfBurnable + tfMutable + tfTransferable)

### Flag Behavior:
- **tfTransferable**: Required for TransferFee to work
- **tfOnlyXRP**: Prevents non-XRP currency trades
- **tfBurnable**: Allows issuer to destroy token
- **tfMutable**: Allows URI updates via NFTokenModify
- **tfTrustLine**: Deprecated, causes error if amendment enabled

## Issuing on Behalf of Another Account

To mint an NFT for another account (Account B) using your account (Account A):

### Step 1: Authorize the Minter
Account B must set its NFTokenMinter field to Account A:
\`\`\`json
{
  "TransactionType": "AccountSet",
  "Account": "rAccountBAddress",
  "SetFlag": 10,
  "NFTokenMinter": "rAccountAAddress",
  "Fee": "12"
}
\`\`\`

### Step 2: Mint the NFT
Account A mints the NFT with Account B as issuer:
\`\`\`json
{
  "TransactionType": "NFTokenMint",
  "Account": "rAccountAAddress",
  "Issuer": "rAccountBAddress",
  "TransferFee": 25000,
  "NFTokenTaxon": 0,
  "Flags": 8,
  "Fee": "10",
  "URI": "697066733A2F2F62616679626569676479727A74357366703775646D37687537367568377932366E6634646675796C71616266336F636C67747179353566627A6469"
}
\`\`\`

## URI Encoding and Examples

### Converting String to Hex:
\`\`\`javascript
// Using xrpl utility
const hexUri = xrpl.convertStringToHex("ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf4dfuylqabf3oclgtqy55fbzdi")

// Manual conversion
const uri = "https://example.com/metadata.json"
const hexUri = Buffer.from(uri).toString('hex')
\`\`\`

### URI Examples:
- **HTTP URL**: "https://example.com/nft/123" → hex encoded
- **IPFS URI**: "ipfs://QmHash" → hex encoded
- **Data URL**: "data:application/json;base64,eyJuYW1lIjoiTXkgTkZUIn0=" → hex encoded
- **Custom**: Any arbitrary data up to 256 bytes

## Example NFTokenMint Transactions

### Basic NFT Mint:
\`\`\`json
{
  "TransactionType": "NFTokenMint",
  "Account": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
  "NFTokenTaxon": 0,
  "Flags": 8,
  "Fee": "10",
  "URI": "697066733A2F2F62616679626569676479727A74357366703775646D37687537367568377932366E6634646675796C71616266336F636C67747179353566627A6469"
}
\`\`\`

### NFT with Transfer Fee:
\`\`\`json
{
  "TransactionType": "NFTokenMint",
  "Account": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
  "TransferFee": 314,
  "NFTokenTaxon": 0,
  "Flags": 8,
  "Fee": "10",
  "URI": "697066733A2F2F62616679626569676479727A74357366703775646D37687537367568377932366E6634646675796C71616266336F636C67747179353566627A6469"
}
\`\`\`

### Burnable and Transferable NFT:
\`\`\`json
{
  "TransactionType": "NFTokenMint",
  "Account": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
  "NFTokenTaxon": 0,
  "Flags": 9,
  "Fee": "10",
  "URI": "697066733A2F2F62616679626569676479727A74357366703775646D37687537367568377932366E6634646675796C71616266336F636C67747179353566627A6469"
}
\`\`\`

### NFT with Memos (Additional Information):
\`\`\`json
{
  "TransactionType": "NFTokenMint",
  "Account": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
  "TransferFee": 314,
  "NFTokenTaxon": 0,
  "Flags": 8,
  "Fee": "10",
  "URI": "697066733A2F2F62616679626569676479727A74357366703775646D37687537367568377932366E6634646675796C71616266336F636C67747179353566627A6469",
  "Memos": [
    {
      "Memo": {
        "MemoType": "687474703A2F2F6578616D706C652E636F6D2F6D656D6F2F67656E65726963",
        "MemoData": "72656E74"
      }
    }
  ]
}
\`\`\`

## Transfer Fee Calculation

### Fee Structure:
- **TransferFee**: Integer from 0 to 50000
- **Percentage**: TransferFee / 1000 = percentage
- **Examples**:
  - 0 = 0% fee
  - 1000 = 1% fee
  - 25000 = 25% fee
  - 50000 = 50% fee (maximum)

### Fee Collection:
- Fees are collected by the issuer
- Paid in the same currency as the transfer
- tfOnlyXRP flag can restrict fees to XRP only

## Error Conditions

### Amendment-Related Errors:
- **temDISABLED**: NonFungibleTokensV1 amendment not enabled
- **temINVALID_FLAG**: Invalid flag combination (e.g., tfTrustLine with amendment enabled)

### Validation Errors:
- **temBAD_NFTOKEN_TRANSFER_FEE**: TransferFee outside 0-50000 range
- **temMALFORMED**: Invalid transaction specification (e.g., URI > 256 bytes)

### Permission Errors:
- **tecNO_ISSUER**: Issuer account doesn't exist
- **tecNO_PERMISSION**: Issuer hasn't authorized sender to mint on their behalf

### Resource Errors:
- **tecINSUFFICIENT_RESERVE**: Account wouldn't meet reserve requirement after minting
- **tecMAX_SEQUENCE_REACHED**: Issuer has reached maximum NFT count (2^32-1)

## Important Notes:

### Amendment Requirements:
- **NonFungibleTokensV1_1**: Required for all NFT operations
- **fixRemoveNFTokenAutoTrustLine**: Makes tfTrustLine flag invalid

### Reserve Requirements:
- New NFTokens increase owner's reserve if new NFTokenPage is needed
- Each NFTokenPage can hold up to 32 NFTs
- Reserve calculation includes NFTokenPage objects

### Immutable Fields:
- **TokenFlags**: Set once during minting, cannot be changed
- **NFTokenTaxon**: Permanent identifier for the NFT
- **TransferFee**: Cannot be modified after minting

### Mutable Fields:
- **URI**: Can be updated if tfMutable flag is set
- Use NFTokenModify transaction to update URI

### Security Considerations:
- **tfBurnable**: Allows issuer to destroy token (use carefully)
- **tfMutable**: Allows URI changes (consider permanence)
- **TransferFee**: Permanent fee structure (cannot be changed)
- **Issuer Authorization**: Verify NFTokenMinter settings before minting

### Best Practices:
- Use meaningful NFTokenTaxon values for organization
- Consider URI permanence and accessibility
- Test transfer fees with small amounts first
- Verify amendment status before minting
- Use memos for additional metadata when needed`,
  inputSchema: z.object({
    network: z.string(),
    txn: z.custom<NFTokenMint>(),
    seed: z.string().optional(),
    signature: z.string().optional(),
  }),
  execute: async ({ context, mastra }) => {
    const { network, txn, seed, signature } = context

    return await submitTransaction({ network, txn, seed, mastra, signature })
  },
})
