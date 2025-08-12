import { currencyCodeToHex, isString, isUndefined } from '../../../../helpers'
import { useTransactionToolFactory } from '../factory'
import { xrplAmmCreateSchema } from './amm-create.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplAmmCreateSchema,
})

export const submitAmmCreateTool = createTransactionTool({
  toolId: 'submit-amm-create',
  description: `Submit an AMMCreate transaction to create a new Automated Market Maker (AMM) instance for trading a pair of assets on the XRPL.

## What is AMMCreate?
Creates a new AMM instance that allows automated trading between two assets (fungible tokens or XRP). The AMM creates both an AMM ledger entry and a special AccountRoot entry, transfers ownership of the starting balances to the AMM, and issues LP (Liquidity Provider) tokens to the creator.

## Required Fields:
- **Amount**: First asset to fund the AMM (Currency Amount - XRP string in drops or token object)
- **Amount2**: Second asset to fund the AMM (Currency Amount - XRP string in drops or token object)
- **TradingFee**: Fee for trades against this AMM (number, 0-1000, where 1000 = 1% fee)

## Asset Pair Rules:
- At most one asset can be XRP (the other must be a token)
- Cannot create AMM with two XRP amounts
- Cannot create AMM with the same token (same currency + issuer)
- Both assets must be positive amounts
- Token issuers must have Default Ripple enabled
- Assets cannot be LP tokens from another AMM
- If the currency code is not a valid ISO 4217 code, it must be a 160-bit hex string

## Important Considerations:
- **Equal Value Funding**: Fund with approximately equal-value amounts to avoid arbitrage losses
- **Trading Fee**: Set based on asset pair volatility (higher volatility = higher fee)
- **Special Cost**: Requires 0.2 XRP (instead of standard 0.00001 XRP) due to ledger entry creation
- **Reserve Requirements**: Account needs sufficient XRP for new trust line (LP tokens)

## Common Error Cases:
- **tecDUPLICATE**: AMM already exists for this currency pair
- **tecFROZEN**: One or both assets are frozen
- **tecNO_AUTH**: No authorization for authorized trust line assets
- **tecNO_LINE**: No trust line for one or both assets
- **tecUNFUNDED_AMM**: Insufficient balance of specified assets
- **terNO_RIPPLE**: Token issuer doesn't have Default Ripple enabled
- **temAMM_BAD_TOKENS**: Invalid asset pair (e.g., same token)
- **temBAD_FEE**: TradingFee outside 0-1000 range

## Example Usage:
\`\`\`json
{
  "Account": "rJVUeRqDFNs2xqA7ncVE6ZoAhPUoaJJSQm",
  "Amount": {
    "currency": "TST",
    "issuer": "rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd",
    "value": "25"
  },
  "Amount2": "250000000",
  "TradingFee": 500,
  "TransactionType": "AMMCreate"
}
\`\`\`

**Note**: This creates an AMM for TST token vs XRP with 0.5% trading fee.`,
  buildTransaction: ammCreate => {
    const { Amount, Amount2, ...rest } = ammCreate

    // Convert Amount and Amount2 to hex if they are strings
    return {
      Amount: isString(Amount)
        ? Amount
        : {
            ...Amount,
            currency: currencyCodeToHex(Amount.currency),
          },
      Amount2: isString(Amount2)
        ? Amount2
        : {
            ...Amount2,
            currency: currencyCodeToHex(Amount2.currency),
          },
      ...rest,
    }
  },
  validateTransaction: params => {
    if (isUndefined(params.Amount) || isUndefined(params.Amount2)) {
      throw new Error('Both Amount and Amount2 must be provided for AMMCreate')
    }

    if (params.TradingFee < 0 || params.TradingFee > 1000) {
      throw new Error('TradingFee must be between 0 and 1000')
    }
  },
})

/**
 * Helper function to calculate trading fee percentage
 */
export const calculateTradingFeePercentage = (tradingFee: number): number => {
  return (tradingFee / 100000) * 100
}
