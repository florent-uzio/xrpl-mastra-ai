import { createTool } from '@mastra/core/tools'
import { TrustSet } from 'xrpl'
import z from 'zod'
import { submitTransaction } from './shared'

export const submitTrustSetTool = createTool({
  id: 'submit-trustset',
  description: `Submit a TrustSet transaction to the XRPL network. A TrustSet transaction creates or modifies a trust line linking two accounts, allowing them to hold tokens issued by each other. Trust lines are required for holding non-XRP currencies and tokens on the XRPL.

## TrustSet Transaction Fields

### Required Fields:
- **Account**: The account creating or modifying the trust line (string - address)
- **LimitAmount**: Object defining the trust line to create or modify (object, required)
  - **currency**: The currency code (string, required)
    - Three-letter ISO 4217 currency code (e.g., "USD", "EUR")
    - "XRP" is invalid (XRP doesn't use trust lines)
    - If the currency code is not a standard currency code (more than 3 characters), you must use the currencyCodeToHexTool to convert it to a 160-bit hex value.
  - **issuer**: The address of the account to extend trust to (string - address, required)
  - **value**: Quoted decimal representation of the limit to set (string, required)
    - Maximum amount of this currency the account can hold
    - Example: "100" for 100 USD, "1000" for 1000 EUR

### Optional Fields:
- **QualityIn**: Value incoming balances at this ratio per 1,000,000,000 units (number, optional)
  - 0 = treat balances at face value (default)
  - Example: 10,000,000 = 1% fee on incoming funds
  - If sender sends 100 currency, sender retains 1 unit, destination receives 99
- **QualityOut**: Value outgoing balances at this ratio per 1,000,000,000 units (number, optional)
  - 0 = treat balances at face value (default)
  - Example: 10,000,000 = 1% fee on outgoing funds
  - If sender sends 100 currency, issuer retains 1 unit, destination receives 99
- **Flags**: Transaction flags to control trust line behavior (number, optional)
- **Fee**: Transaction cost in drops (string, optional)
- **Sequence**: Account sequence number (number, optional)
- **LastLedgerSequence**: Last ledger to process transaction (number, optional)

## TrustSet Flags

| Flag Name | Hex Value | Decimal Value | Description |
|-----------|-----------|---------------|-------------|
| tfSetfAuth | 0x00010000 | 65536 | Authorize the other party to hold currency issued by this account |
| tfSetNoRipple | 0x00020000 | 131072 | Enable the No Ripple flag, blocking rippling between trust lines |
| tfClearNoRipple | 0x00040000 | 262144 | Disable the No Ripple flag, allowing rippling on this trust line |
| tfSetFreeze | 0x00100000 | 1048576 | Freeze the trust line |
| tfClearFreeze | 0x00200000 | 2097152 | Unfreeze the trust line |
| tfSetDeepFreeze | 0x00400000 | 4194304 | Deep Freeze the trust line |
| tfClearDeepFreeze | 0x00800000 | 8388608 | Clear the Deep Freeze on the trust line |

## Flag Descriptions

### tfSetfAuth (Authorization)
- Authorizes the other party to hold currency issued by this account
- No effect unless using asfRequireAuth AccountSet flag
- Cannot be unset once set
- Allows pre-authorization even with 0 limit and balance

### tfSetNoRipple / tfClearNoRipple (Rippling Control)
- **tfSetNoRipple**: Blocks rippling between trust lines of the same currency, you would typically when a holder sets a trustline.
- **tfClearNoRipple**: Allows rippling on this trust line
- Both flags must be enabled on both trust lines to block rippling
- If transaction tries to enable No Ripple but cannot, fails with tecNO_PERMISSION

### tfSetFreeze / tfClearFreeze (Freeze Control)
- **tfSetFreeze**: Freezes the trust line, preventing new transactions
- **tfClearFreeze**: Unfreezes the trust line, allowing transactions
- Freeze prevents new trust line transactions but doesn't affect existing balances

### tfSetDeepFreeze / tfClearDeepFreeze (Deep Freeze Control)
- **tfSetDeepFreeze**: Applies deep freeze to the trust line
- **tfClearDeepFreeze**: Removes deep freeze from the trust line
- Deep freeze is a more permanent form of freezing

## Quality Values

### QualityIn (Incoming Balance Valuation)
- Controls how incoming balances are valued
- 0 = face value (default)
- Higher values = fees on incoming funds
- Example: 10,000,000 = 1% fee (10,000,000 / 1,000,000,000 = 0.01 = 1%)

### QualityOut (Outgoing Balance Valuation)
- Controls how outgoing balances are valued
- 0 = face value (default)
- Higher values = fees on outgoing funds
- Example: 10,000,000 = 1% fee (10,000,000 / 1,000,000,000 = 0.01 = 1%)

## Example TrustSet Transactions

### Basic Trust Line Creation:
{
  "TransactionType": "TrustSet",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "LimitAmount": {
    "currency": "USD",
    "issuer": "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc",
    "value": "100"
  },
  "Fee": "12"
}

### Trust Line with Authorization:
{
  "TransactionType": "TrustSet",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "LimitAmount": {
    "currency": "EUR",
    "issuer": "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc",
    "value": "1000"
  },
  "Flags": 65536,
  "Fee": "12"
}

### Trust Line with No Ripple:
{
  "TransactionType": "TrustSet",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "LimitAmount": {
    "currency": "USD",
    "issuer": "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc",
    "value": "500"
  },
  "Flags": 131072,
  "Fee": "12"
}

### Trust Line with Quality Values:
{
  "TransactionType": "TrustSet",
  "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
  "LimitAmount": {
    "currency": "USD",
    "issuer": "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc",
    "value": "1000"
  },
  "QualityIn": 10000000,
  "QualityOut": 5000000,
  "Fee": "12"
}

## Important Notes:

### Trust Line Requirements
- Trust lines are required for holding non-XRP currencies and tokens
- XRP does not use trust lines (XRP is native to the ledger)
- Each trust line counts toward the account's XRP reserve requirement
- Trust lines can be created with 0 limit and balance

### Authorization
- tfSetfAuth allows pre-authorization of trust lines
- Useful for issuers who want to control who can hold their tokens
- Authorization is separate from limit and balance
- Cannot be unset once set

### Rippling
- Rippling allows automatic currency conversion through trust lines
- No Ripple flag blocks rippling between trust lines of the same currency
- Both parties must enable No Ripple to block rippling
- Useful for preventing unwanted currency flows

### Freezing
- Freeze prevents new transactions on the trust line
- Existing balances are not affected by freezing
- Deep freeze is a more permanent form of freezing
- Only the issuer can freeze trust lines for their issued currency

### Quality Values
- Quality values affect how balances are valued in cross-currency payments
- Higher quality values = fees on currency transfers
- Quality values are separate from token transfer fees
- Useful for implementing transfer fees or exchange rate controls

### Error Conditions
- tecNO_PERMISSION: Issuer blocks incoming trust lines (requires DisallowIncoming amendment)
- tecNO_PERMISSION: Cannot enable No Ripple (after fix1578 amendment)
- tesSUCCESS: No Ripple enablement fails but other changes succeed (before fix1578 amendment)

### Currency Codes
- Currency codes are case-sensitive
- Standard currency codes are 3 characters long
- Custom currency codes are 160-bit hex values
- Currency codes are not case-sensitive
- Use the currencyCodeToHexTool and hexToCurrencyCodeTool to convert between currency codes and hex values when necessary.

### Amendment Requirements
- DisallowIncoming amendment: Allows issuers to block incoming trust lines
- fix1578 amendment: Changes behavior of No Ripple enablement failures`,
  inputSchema: z.object({
    network: z.string(),
    txn: z.custom<TrustSet>(),
    seed: z.string().optional(),
    signature: z.string().optional(),
  }),
  execute: async ({ context, mastra }) => {
    const { network, txn, seed, signature } = context

    return await submitTransaction({ network, txn, seed, mastra, signature })
  },
})
