import { createTool } from '@mastra/core/tools'
import { OfferCancel } from 'xrpl'
import { z } from 'zod'
import { submitTransaction } from './shared'

export const submitOfferCancelTool = createTool({
  id: 'submit-offer-cancel',
  description: `Submit an OfferCancel transaction to the XRPL network. This transaction removes an Offer object from the XRP Ledger, effectively cancelling a previously created offer in the decentralized exchange (DEX).

## OfferCancel Transaction Fields

### Required Fields:
- **Account**: The account cancelling the offer (string - address, required)
- **OfferSequence**: The sequence number of the previous OfferCreate transaction (number, required)
  - Must be lower than the current transaction's Sequence number
  - Can also be a Ticket number if using tickets
  - Cancels any offer object created by that specific transaction
  - Returns success even if the offer doesn't exist

### Optional Fields:
- **Fee**: Transaction cost in drops, typically the autofill sets it, don't try to set it unless instructed otherwise (string, optional)
- **Sequence**: Account sequence number, typically the autofill sets it, don't try to set it unless instructed otherwise (number, optional)
- **LastLedgerSequence**: Last ledger to process transaction, typically the autofill sets it, don't try to set it unless instructed otherwise (number, optional)
- **Flags**: Transaction flags (number, optional, typically 0)

## How OfferCancel Works

### Offer Identification:
- **OfferSequence**: References the sequence number of the original OfferCreate transaction
- **Offer Object**: The actual offer object in the ledger created by that transaction
- **Cancellation**: Removes the offer from the order book, making it unavailable for trading

### Success Conditions:
- **tesSUCCESS**: Always returned, even if the offer doesn't exist
- **No Error**: Not considered an error if the specified offer doesn't exist
- **Partial Cancellation**: If the offer was partially filled, cancels the remaining portion

### Alternative Approach:
Instead of using OfferCancel + OfferCreate, you can use OfferCreate with the OfferSequence parameter to replace an existing offer in a single transaction.

## Example OfferCancel Transactions

### Basic Offer Cancellation:
\`\`\`json
{
  "TransactionType": "OfferCancel",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "OfferSequence": 6,
  "Fee": "12",
  "Flags": 0,
  "Sequence": 7
}
\`\`\`

### Offer Cancellation with LastLedgerSequence:
\`\`\`json
{
  "TransactionType": "OfferCancel",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "OfferSequence": 6,
  "Fee": "12",
  "Flags": 0,
  "LastLedgerSequence": 7108629,
  "Sequence": 7
}
\`\`\`

### Cancelling Multiple Offers:
\`\`\`json
{
  "TransactionType": "OfferCancel",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "OfferSequence": 5,
  "Fee": "12",
  "Flags": 0,
  "Sequence": 8
}
\`\`\`

## Offer Replacement Strategy

### Method 1: Cancel and Create (Two Transactions)
1. **Cancel the offer** using OfferCancel with the original OfferSequence
2. **Create new offer** using OfferCreate with new parameters

### Method 2: Replace in One Transaction (Recommended)
Use OfferCreate with the OfferSequence parameter to replace the existing offer:

\`\`\`json
{
  "TransactionType": "OfferCreate",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "OfferSequence": 6,
  "TakerGets": "5000000",
  "TakerPays": {
    "currency": "USD",
    "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "value": "90"
  },
  "Fee": "12",
  "Flags": 0,
  "Sequence": 7
}
\`\`\`

## Important Notes:

### Transaction Behavior:
- **Always Successful**: Returns tesSUCCESS even if offer doesn't exist
- **No Error Handling**: Not considered an error if offer is already cancelled
- **Partial Fills**: Cancels remaining unfilled portion of the offer
- **Sequence Validation**: OfferSequence must be lower than current transaction Sequence

### Offer Lifecycle:
1. **OfferCreate**: Creates offer in order book
2. **Partial Fill**: Some amount traded, remainder remains
3. **OfferCancel**: Removes remaining offer from order book
4. **Complete**: Offer no longer available for trading

### Best Practices:
- **Use OfferSequence**: Always specify the correct OfferSequence from the original OfferCreate
- **Verify Existence**: Check if offer exists before cancelling (optional)
- **Consider Replacement**: Use OfferCreate with OfferSequence for efficiency
- **Monitor Status**: Track offer status to avoid unnecessary cancellations

### Error Conditions:
- **tecNO_SUCH_OFFER**: Offer doesn't exist (rare, usually returns success anyway)
- **tecINSUFFICIENT_RESERVE**: Account doesn't have enough XRP for transaction fee
- **tecUNFUNDED**: Account doesn't have enough XRP for reserve requirement

### Security Considerations:
- **Authorization**: Only the offer creator can cancel their own offers
- **Sequence Management**: Ensure OfferSequence is correct to avoid cancelling wrong offer
- **Fee Management**: Ensure sufficient XRP for transaction fee
- **Reserve Requirements**: Account for reserve changes when cancelling offers

### Use Cases:
- **Price Updates**: Cancel old offer and create new one with different price
- **Amount Changes**: Modify offer quantity by cancelling and recreating
- **Market Exit**: Remove offers when exiting trading positions
- **Error Correction**: Cancel offers created with incorrect parameters
- **Strategy Changes**: Cancel offers when changing trading strategy

### Performance Considerations:
- **Single Transaction**: Use OfferCreate with OfferSequence for efficiency
- **Batch Operations**: Cancel multiple offers in sequence if needed
- **Network Load**: Consider transaction timing to avoid congestion
- **Fee Optimization**: Use appropriate fees for timely processing

### Monitoring and Tracking:
- **Offer Status**: Track which offers are active vs cancelled
- **Sequence Numbers**: Maintain accurate sequence number tracking
- **Order Book**: Monitor order book changes after cancellation
- **Transaction History**: Review transaction history for offer lifecycle`,
  inputSchema: z.object({
    network: z.string(),
    txn: z.custom<OfferCancel>(),
    seed: z.string().optional(),
    signature: z.string().optional(),
  }),
  execute: async ({ context, mastra }) => {
    const { network, txn, seed, signature } = context

    return await submitTransaction({ network, txn, seed, mastra, signature })
  },
})
