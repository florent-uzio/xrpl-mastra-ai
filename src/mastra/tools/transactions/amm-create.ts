import { createTool } from '@mastra/core/tools'
import { AMMCreate } from 'xrpl'
import z from 'zod'
import { submitTransaction } from './shared'

export const submitAmmCreateTool = createTool({
  id: 'submit-amm-create',
  description: `Submit an AMMCreate transaction to the XRPL network. This transaction creates a new Automated Market Maker (AMM) instance for trading a pair of assets (fungible tokens or XRP). The AMM provides automated liquidity and trading for the specified asset pair.

**Requires the AMM amendment to be enabled.**

## AMMCreate Transaction Fields

### Required Fields:
- **Account**: The account creating the AMM (string - address, required)
- **Amount**: The first asset to fund this AMM with (currency amount, required)
  - Must be a positive amount
  - Can be XRP (string in drops) or issued currency (object with currency, issuer, value)
  - If the currency code is not a standard currency code (more than 3 characters), you must use the currencyCodeToHexTool to convert it to a 160-bit hex value
- **Amount2**: The second asset to fund this AMM with (currency amount, required)
  - Must be a positive amount
  - Can be XRP (string in drops) or issued currency (object with currency, issuer, value)
  - If the currency code is not a standard currency code (more than 3 characters), you must use the currencyCodeToHexTool to convert it to a 160-bit hex value
- **TradingFee**: The fee to charge for trades against this AMM (number, required)
  - Units: 1/100,000 (1 = 0.001%)
  - Range: 0 to 1000 (0% to 1%)
  - Example: 500 = 0.5% trading fee

### Optional Fields:
- **Fee**: Transaction cost in drops, typically autofill sets it (string, optional)
- **Sequence**: Account sequence number, typically autofill sets it (number, optional)
- **LastLedgerSequence**: Last ledger to process transaction, typically autofill sets it (number, optional)
- **Flags**: Transaction flags (number, optional)

## Special Transaction Cost

AMMCreate transactions require a much higher transaction cost than standard transactions to deter ledger spam:

- **Standard Minimum**: 0.00001 XRP
- **AMMCreate Minimum**: 0.2 XRP (incremental owner reserve amount)
- **Reason**: Each AMM creates an AccountRoot ledger entry, AMM ledger entry, and trust lines
- **Same Cost**: As AccountDelete transactions

## Asset Pair Requirements

### Valid Combinations:
- **Token + Token**: Two different issued currencies
- **Token + XRP**: One issued currency and XRP
- **XRP + Token**: XRP and one issued currency

### Invalid Combinations:
- **XRP + XRP**: Cannot create AMM for XRP/XRP pair
- **Same Token**: Cannot use same currency code and issuer for both amounts
- **LP Tokens**: Cannot use LP tokens from another AMM

### Token Requirements:
- **Default Ripple**: Token issuers must have Default Ripple enabled
- **Trust Lines**: Sender must have trust lines for both tokens
- **Authorization**: Must be authorized to hold tokens if using authorized trust lines
- **Not Frozen**: Tokens cannot be frozen

## Example AMMCreate Transactions

### Token + XRP AMM:
\`\`\`json
{
  "TransactionType": "AMMCreate",
  "Account": "rJVUeRqDFNs2xqA7ncVE6ZoAhPUoaJJSQm",
  "Amount": {
    "currency": "TST",
    "issuer": "rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd",
    "value": "25"
  },
  "Amount2": "250000000",
  "TradingFee": 500,
  "Fee": "2000000",
  "Flags": 2147483648,
  "Sequence": 6
}
\`\`\`

### Token + Token AMM:
\`\`\`json
{
  "TransactionType": "AMMCreate",
  "Account": "rJVUeRqDFNs2xqA7ncVE6ZoAhPUoaJJSQm",
  "Amount": {
    "currency": "USD",
    "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "value": "1000"
  },
  "Amount2": {
    "currency": "EUR",
    "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "value": "850"
  },
  "TradingFee": 300,
  "Fee": "2000000",
  "Flags": 2147483648,
  "Sequence": 6
}
\`\`\`

### XRP + Token AMM:
\`\`\`json
{
  "TransactionType": "AMMCreate",
  "Account": "rJVUeRqDFNs2xqA7ncVE6ZoAhPUoaJJSQm",
  "Amount": "1000000000",
  "Amount2": {
    "currency": "FOO",
    "issuer": "rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd",
    "value": "100"
  },
  "TradingFee": 400,
  "Fee": "2000000",
  "Flags": 2147483648,
  "Sequence": 6
}
\`\`\`

## Trading Fee Calculation

### Fee Structure:
- **TradingFee**: Integer from 0 to 1000
- **Percentage**: TradingFee / 100,000 = percentage
- **Examples**:
  - 0 = 0% fee
  - 100 = 0.1% fee
  - 500 = 0.5% fee
  - 1000 = 1% fee (maximum)

### Fee Considerations:
- **Volatility**: Higher fees offset currency risk for volatile pairs
- **Competition**: Consider market rates for similar asset pairs
- **Liquidity**: Higher fees may reduce trading volume
- **Risk Management**: Balance fee income against impermanent loss risk

## What Gets Created

### Ledger Entries:
1. **AMM Entry**: Contains AMM configuration and state
2. **AccountRoot**: Special account representing the AMM
3. **Trust Lines**: For LP tokens issued to the creator

### Asset Transfers:
- **Asset Transfer**: Starting balances transferred from sender to AMM
- **LP Token Issuance**: Initial LP tokens issued to sender
- **Ownership**: AMM account owns the pooled assets

### LP Token Details:
- **Currency Code**: Automatically generated based on asset pair
- **Issuer**: The AMM account address
- **Value**: Represents share of the liquidity pool
- **Usage**: Used for liquidity provision and fee collection

## Error Conditions

### Amendment-Related Errors:
- **temDISABLED**: AMM feature is not enabled on the network

### Validation Errors:
- **temAMM_BAD_TOKENS**: Amount and Amount2 values are not valid (e.g., same token)
- **temBAD_FEE**: TradingFee is invalid (must be 0-1000, positive integer)

### Asset Errors:
- **tecAMM_INVALID_TOKENS**: Currency code conflicts with LP token currency
- **tecDUPLICATE**: Another AMM already exists for this currency pair
- **tecFROZEN**: At least one deposit asset is currently frozen
- **tecNO_PERMISSION**: At least one asset cannot be used in an AMM

### Trust Line Errors:
- **tecNO_LINE**: Sender doesn't have trust line for at least one asset
- **tecNO_AUTH**: Sender not authorized to hold at least one asset
- **terNO_RIPPLE**: Issuer of at least one asset hasn't enabled Default Ripple

### Reserve and Funding Errors:
- **tecINSUF_RESERVE_LINE**: Sender doesn't meet increased reserve requirement
- **tecUNFUNDED_AMM**: Sender doesn't hold enough of the specified assets

## Important Notes:

### Amendment Requirements:
- **AMM**: Required for all AMM functionality

### Asset Pair Considerations:
- **Equal Value**: Fund with approximately equal-value amounts to avoid arbitrage
- **Currency Risk**: Higher volatility increases impermanent loss risk
- **Trading Fee**: Set based on asset pair volatility
- **LP Tokens**: Cannot use LP tokens from other AMMs

### Setup Requirements:
- **Trust Lines**: Must have trust lines for both assets
- **Authorization**: Must be authorized if using authorized trust lines
- **Default Ripple**: Token issuers must have Default Ripple enabled
- **Not Frozen**: Assets cannot be frozen

### Economic Considerations:
- **Impermanent Loss**: Risk of loss when providing liquidity
- **Arbitrage**: Unequal funding allows others to profit at your expense
- **Fee Income**: Trading fees help offset impermanent loss
- **Volatility**: Higher volatility increases risk and required fees

### Best Practices:
- **Equal Funding**: Fund with equal-value amounts of each asset
- **Fee Optimization**: Set trading fee based on asset volatility
- **Risk Assessment**: Consider impermanent loss risk before creating AMM
- **Market Research**: Analyze existing AMMs for similar asset pairs
- **Reserve Planning**: Ensure sufficient XRP for transaction cost and reserves

### Security Considerations:
- **Asset Verification**: Verify asset issuers and trust line status
- **Fee Validation**: Ensure trading fee is within acceptable range
- **Reserve Management**: Account for increased reserve requirements
- **Asset Quality**: Only use trusted, legitimate assets

### Use Cases:
- **Liquidity Provision**: Provide automated liquidity for asset pairs
- **Fee Generation**: Earn trading fees from AMM activity
- **Market Making**: Create markets for new or illiquid asset pairs
- **DeFi Integration**: Enable decentralized trading and liquidity

### Monitoring and Management:
- **LP Token Tracking**: Monitor LP token balance and value
- **Fee Collection**: Track trading fee income
- **Impermanent Loss**: Monitor for potential losses
- **Market Conditions**: Adjust strategy based on market changes

### Technical Considerations:
- **Amendment Status**: Verify AMM amendment is enabled
- **Asset Compatibility**: Ensure assets meet AMM requirements
- **Reserve Calculation**: Account for increased reserve requirements
- **Trust Line Management**: Verify trust line status and authorization`,
  inputSchema: z.object({
    network: z.string(),
    txn: z.custom<AMMCreate>(),
    seed: z.string().optional(),
    signature: z.string().optional(),
  }),
  execute: async ({ context, mastra }) => {
    const { network, txn, seed, signature } = context

    return await submitTransaction({ network, txn, seed, mastra, signature })
  },
})
