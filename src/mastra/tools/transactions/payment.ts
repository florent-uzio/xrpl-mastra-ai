import { createTool } from '@mastra/core/tools'
import { Payment } from 'xrpl'
import { z } from 'zod'
import { submitTransaction } from './shared'

export const submitPaymentTool = createTool({
  id: 'submit-payment',
  description: `Submit a Payment transaction to the XRPL network. A Payment transaction represents a transfer of value from one account to another. This is the only transaction type that can create new accounts by sending enough XRP to an unfunded address.

## Payment Transaction Fields

### Required Fields:
- **Account**: The account sending the payment (string - address)
- **Destination**: The account receiving the payment (string - address)
- **DeliverMax**: The maximum amount of currency to deliver (Currency Amount, required in API v2)
  - For XRP payments: String amount in drops (e.g., "1000000" for 1 XRP)
  - For token payments: Object with currency, value, and issuer
  - For MPT payments: Object with mpt_issuance_id and value

### Optional Fields:
- **Amount**: Alias to DeliverMax (Currency Amount, required in API v1)
- **SendMax**: Maximum amount to spend (Currency Amount, optional)
  - If not specified, defaults to DeliverMax
  - For cross-currency payments, this is typically in the source currency
- **DeliverMin**: Minimum amount to deliver (Currency Amount, optional)
  - Only valid for partial payments
  - Must be less than or equal to DeliverMax
- **DestinationTag**: Arbitrary tag for payment identification (number, optional)
- **InvoiceID**: 256-bit value representing payment reason (string - hex, optional)
- **Paths**: Array of payment paths for cross-currency payments (array, optional)
  - Must be omitted for XRP-to-XRP or direct trust line payments
  - Auto-fillable by the server if not provided
- **Flags**: Transaction flags (number, optional)
  - tfNoRippleDirect (0x00010000): Only use specified paths, not default path
  - tfPartialPayment (0x00020000): Allow partial payment success
  - tfLimitQuality (0x00040000): Set minimum quality for conversions
- **Fee**: Transaction cost in drops, typically the autofill sets it, don't try to set it unless instructed otherwise (string, optional)
- **Sequence**: Account sequence number (number, optional)
- **LastLedgerSequence**: Last ledger to process transaction, typically the autofill sets it, don't try to set it unless instructed otherwise (number, optional)

### Special Fields (Require Amendments):
- **CredentialIDs**: Set of credentials for deposit authorization (array of strings, optional)
  - Requires Credentials amendment
  - Must match preauthorized credentials in DepositPreauth entry
- **DomainID**: Permissioned domain for cross-currency payments (string - hash, optional)
  - Requires PermissionedDEX amendment
  - Only affects cross-currency payments

## Types of Payments

### 1. XRP-to-XRP Payments
- **DeliverMax**: XRP amount in drops (string)
- **SendMax**: Same as DeliverMax (optional)
- **Paths**: Must be omitted

### 2. Direct Trust Line Payments
- **DeliverMax**: Token amount with currency and issuer
- **SendMax**: Same currency as DeliverMax
- **Paths**: Must be omitted

### 3. Cross-Currency Payments
- **DeliverMax**: Destination currency amount
- **SendMax**: Source currency amount
- **Paths**: Optional, server can auto-fill

### 4. Partial Payments
- **DeliverMax**: Maximum amount to deliver
- **DeliverMin**: Minimum amount to deliver (optional)
- **SendMax**: Maximum amount to spend
- **Flags**: Must include tfPartialPayment (0x00020000)

### 5. MPT Payments (Requires MPTokensV1 amendment)
- **DeliverMax**: Object with mpt_issuance_id and value
- **SendMax**: Same MPT issuance ID and value
- **Amount**: Same as DeliverMax

## Payment Flags

| Flag Name | Hex Value | Decimal Value | Description |
|-----------|-----------|---------------|-------------|
| tfNoRippleDirect | 0x00010000 | 65536 | Only use specified paths, not default path |
| tfPartialPayment | 0x00020000 | 131072 | Allow partial payment success |
| tfLimitQuality | 0x00040000 | 262144 | Set minimum quality for conversions |

## Special Cases

### Creating Accounts
- Send enough XRP to an unfunded address to create it
- Minimum amount: Base reserve (currently 10 XRP)
- Other transactions to unfunded addresses always fail

### Partial Payments
- Enable tfPartialPayment flag
- Can succeed by delivering less than DeliverMax
- Useful for returning payments without additional costs
- delivered_amount in metadata shows actual amount received

### Limit Quality
- Enable tfLimitQuality flag
- Sets minimum quality (conversion rate) for currency exchanges
- Quality = destination amount / send max amount
- Rejects paths with worse quality than limit

### Deposit Authorization
- Requires CredentialIDs field with valid credentials
- Credentials must exist, be accepted, not expired
- Sender must be subject of each credential
- Special case: Accounts below reserve can receive up to base reserve without credentials

### Permissioned DEX
- Use DomainID field for cross-currency payments
- Both sender and recipient must have valid credentials for the domain
- Only affects cross-currency payments

## Example Payment Types

### XRP Payment:
{
  "TransactionType": "Payment",
  "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
  "Destination": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "DeliverMax": "1000000",
  "Fee": "12"
}

### Token Payment:
{
  "TransactionType": "Payment",
  "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
  "Destination": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "DeliverMax": {
    "currency": "USD",
    "value": "1",
    "issuer": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn"
  },
  "SendMax": {
    "currency": "XRP",
    "value": "1000000"
  }
}

### Partial Payment:
{
  "TransactionType": "Payment",
  "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
  "Destination": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "DeliverMax": "1000000",
  "DeliverMin": "500000",
  "SendMax": "2000000",
  "Flags": 131072
}

## Important Notes:
- Payment is the only transaction type that can create accounts
- Cross-currency payments may involve multiple exchanges atomically
- Partial payments can exploit integrations that assume exact delivery amounts
- Paths field is auto-fillable by the server for cross-currency payments
- Quality limits help avoid unfavorable exchange rates
- Deposit authorization requires preauthorized credentials
- MPT payments only support direct transfers, not DEX trading`,
  inputSchema: z.object({
    network: z.string(),
    txn: z.custom<Payment>().optional(),
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
