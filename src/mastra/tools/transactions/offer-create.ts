import { createTool } from '@mastra/core/tools'
import { OfferCreate } from 'xrpl'
import z from 'zod'
import { submitTransaction } from './shared'

export const submitOfferCreateTool = createTool({
  id: 'submit-offer-create',
  description: `Submit an OfferCreate transaction to the XRPL network. This transaction places an Offer in the decentralized exchange (DEX), allowing users to trade currencies, tokens, and XRP.

## OfferCreate Transaction Fields

### Required Fields:
- **Account**: The account creating the offer (string - address, required)
- **TakerGets**: The amount and type of currency being sold (currency amount, required)
  - Can be XRP (string in drops) or issued currency (object with currency, issuer, value)
  - Represents what the offer creator is willing to sell
  - If the currency code is not a standard currency code (more than 3 characters), you must use the currencyCodeToHexTool to convert it to a 160-bit hex value.
- **TakerPays**: The amount and type of currency being bought (currency amount, required)
  - Can be XRP (string in drops) or issued currency (object with currency, issuer, value)
  - Represents what the offer creator wants to receive
  - If the currency code is not a standard currency code (more than 3 characters), you must use the currencyCodeToHexTool to convert it to a 160-bit hex value.

### Optional Fields:
- **Expiration**: Time after which the offer is no longer active (number, optional)
  - In seconds since Ripple Epoch
  - If omitted, offer remains active until cancelled
- **OfferSequence**: An offer to delete first (number, optional)
  - Specifies an existing offer to cancel before creating new one
  - Must be lower than the transaction's Sequence number
- **DomainID**: Permissioned domain for restricted trading (string - hash, optional)
  - Restricts offer to permissioned DEX of that domain
  - Requires PermissionedDEX amendment
  - Required when using tfHybrid flag
- **Fee**: Transaction cost in drops (string, optional)
- **Sequence**: Account sequence number (number, optional)
- **LastLedgerSequence**: Last ledger to process transaction (number, optional)

## OfferCreate Flags

| Flag Name | Hex Value | Decimal Value | Description |
|-----------|-----------|---------------|-------------|
| tfPassive | 0x00010000 | 65536 | Do not consume offers that exactly match this one, only offers that cross it. Enables pegging exchange rates at specific values. |
| tfImmediateOrCancel | 0x00020000 | 131072 | Treat as Immediate or Cancel order. Do not place offer in order books, only consume existing offers during processing. |
| tfFillOrKill | 0x00040000 | 262144 | Treat as Fill or Kill order. Do not place offer in order books, cancel if cannot be fully filled. Owner must receive full TakerPays amount (or spend full TakerGets if tfSell enabled). |
| tfSell | 0x00080000 | 524288 | Exchange entire TakerGets amount, even if it means obtaining more than TakerPays amount in exchange. |
| tfHybrid | 0x00100000 | 1048576 | Make this a hybrid offer that can use both permissioned DEX and open DEX. Requires DomainID field. |

## Flag Combinations and Usage

### Common Flag Combinations:
- **Basic Offer**: No flags (0) - Standard limit order
- **Passive Offer**: Flags: 65536 (tfPassive) - Peg exchange rate
- **Immediate or Cancel**: Flags: 131072 (tfImmediateOrCancel) - Execute immediately or cancel
- **Fill or Kill**: Flags: 262144 (tfFillOrKill) - Execute fully or cancel
- **Sell Order**: Flags: 524288 (tfSell) - Sell entire amount
- **Hybrid Offer**: Flags: 1048576 (tfHybrid) - Use both permissioned and open DEX

### Flag Behavior:
- **tfPassive**: Prevents exact matches, only cross orders
- **tfImmediateOrCancel**: No order book placement, immediate execution only
- **tfFillOrKill**: No order book placement, full execution or cancellation
- **tfSell**: Prioritize selling entire amount over optimal pricing
- **tfHybrid**: Enables dual DEX usage with DomainID

### Invalid Combinations:
- **tfImmediateOrCancel + tfFillOrKill**: Cannot use both immediate and fill-or-kill
- **tfHybrid without DomainID**: Hybrid flag requires DomainID field

## Currency Amount Formats

### XRP Amount:
\`\`\`json
"TakerGets": "6000000"  // 6 XRP in drops
\`\`\`

### Issued Currency Amount:
\`\`\`json
"TakerPays": {
  "currency": "USD",
  "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
  "value": "100.50"
}
\`\`\`

### Hex Currency Code:
\`\`\`json
"TakerPays": {
  "currency": "434553540000000000000000000000000000000000",
  "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
  "value": "50.25"
}
\`\`\`

## Example OfferCreate Transactions

### Basic XRP to Token Offer:
\`\`\`json
{
  "TransactionType": "OfferCreate",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "TakerGets": "6000000",
  "TakerPays": {
    "currency": "USD",
    "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "value": "100"
  },
  "Fee": "12",
  "Flags": 0
}
\`\`\`

### Token to XRP Offer:
\`\`\`json
{
  "TransactionType": "OfferCreate",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "TakerGets": {
    "currency": "EUR",
    "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "value": "50"
  },
  "TakerPays": "3000000",
  "Fee": "12",
  "Flags": 0
}
\`\`\`

### Token to Token Offer:
\`\`\`json
{
  "TransactionType": "OfferCreate",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "TakerGets": {
    "currency": "USD",
    "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "value": "100"
  },
  "TakerPays": {
    "currency": "EUR",
    "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "value": "85"
  },
  "Fee": "12",
  "Flags": 0
}
\`\`\`

### Passive Offer (Peg Exchange Rate):
\`\`\`json
{
  "TransactionType": "OfferCreate",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "TakerGets": "6000000",
  "TakerPays": {
    "currency": "USD",
    "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "value": "100"
  },
  "Fee": "12",
  "Flags": 65536
}
\`\`\`

### Immediate or Cancel Offer:
\`\`\`json
{
  "TransactionType": "OfferCreate",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "TakerGets": "6000000",
  "TakerPays": {
    "currency": "USD",
    "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "value": "100"
  },
  "Fee": "12",
  "Flags": 131072
}
\`\`\`

### Fill or Kill Offer:
\`\`\`json
{
  "TransactionType": "OfferCreate",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "TakerGets": "6000000",
  "TakerPays": {
    "currency": "USD",
    "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "value": "100"
  },
  "Fee": "12",
  "Flags": 262144
}
\`\`\`

### Hybrid Offer with DomainID:
\`\`\`json
{
  "TransactionType": "OfferCreate",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "TakerGets": "6000000",
  "TakerPays": {
    "currency": "USD",
    "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "value": "100"
  },
  "DomainID": "1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
  "Fee": "12",
  "Flags": 1048576
}
\`\`\`

## Error Conditions

### Resource Errors:
- **tecDIR_FULL**: Owner has too many ledger items or order book has too many offers at same rate
- **tecINSUF_RESERVE_OFFER**: Owner doesn't have enough XRP for reserve requirement
- **tecUNFUNDED_OFFER**: Owner doesn't hold positive amount of TakerGets currency

### Permission Errors:
- **tecNO_AUTH**: Token issuer uses Authorized Trust Lines but trust line not authorized
- **tecNO_ISSUER**: Token issuer is not a funded account
- **tecNO_LINE**: Token issuer uses Authorized Trust Lines but trust line doesn't exist
- **tecNO_PERMISSION**: Sender not member of domain (with DomainID)

### Validation Errors:
- **tecEXPIRED**: Expiration time has already passed
- **tecFROZEN**: Token involved in frozen trust line or deep-frozen by issuer
- **tecKILLED**: tfFillOrKill specified but full amount cannot be filled

### Format Errors:
- **temBAD_CURRENCY**: Fungible token specified incorrectly (e.g., "XRP" currency code)
- **temBAD_EXPIRATION**: Expiration field not validly formatted
- **temBAD_ISSUER**: Token has invalid issuer value
- **temBAD_OFFER**: Trading XRP for XRP or invalid/negative token amount
- **temBAD_SEQUENCE**: OfferSequence not valid or higher than transaction Sequence
- **temINVALID_FLAG**: Invalid flag combination (e.g., tfImmediateOrCancel + tfFillOrKill)
- **temREDUNDANT**: Trading token for same token (same issuer and currency)

## Important Notes:

### Amendment Requirements:
- **PermissionedDEX**: Required for DomainID and tfHybrid functionality
- **ImmediateOfferKilled**: Changes tfImmediateOrCancel behavior (returns tecKILLED if no funds moved)

### Order Types:
- **Limit Order**: Standard offer (no flags) - placed in order book
- **Immediate or Cancel**: Execute immediately or cancel (tfImmediateOrCancel)
- **Fill or Kill**: Execute fully or cancel (tfFillOrKill)
- **Passive**: Peg exchange rate without exact matches (tfPassive)

### Trust Line Requirements:
- **Authorized Trust Lines**: Some issuers require explicit authorization
- **Trust Line Creation**: Must exist before trading issued currencies
- **Frozen Trust Lines**: Cannot trade on frozen trust lines

### Reserve Requirements:
- **Offer Reserve**: Additional XRP reserve required for each offer
- **Account Reserve**: Base reserve plus offer reserve
- **Reserve Calculation**: Varies by account type and number of offers

### Best Practices:
- **Price Discovery**: Use passive offers for market making
- **Immediate Execution**: Use immediate or cancel for quick trades
- **Full Execution**: Use fill or kill for complete trades
- **Trust Line Management**: Ensure trust lines exist and are authorized
- **Reserve Planning**: Account for offer reserve requirements
- **Currency Validation**: Verify currency codes and issuers
- **Sequence Management**: Use OfferSequence to replace existing offers

### Security Considerations:
- **Trust Line Authorization**: Verify trust line status before trading
- **Issuer Validation**: Ensure token issuers are legitimate
- **Reserve Management**: Monitor account reserves to prevent tecINSUF_RESERVE_OFFER
- **Domain Membership**: Verify domain membership for permissioned DEX usage`,
  inputSchema: z.object({
    network: z.string(),
    txn: z.custom<OfferCreate>().optional(),
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
