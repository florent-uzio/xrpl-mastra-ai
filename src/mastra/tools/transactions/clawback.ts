import { createTool } from '@mastra/core/tools'
import { Clawback } from 'xrpl'
import z from 'zod'
import { submitTransaction } from './shared'

export const submitClawbackTool = createTool({
  id: 'submit-clawback',
  description: `Submit a Clawback transaction to the XRPL network. This transaction allows an issuer to claw back (recover) tokens that they have issued from a holder's account. Clawback is a powerful feature that enables issuers to recover assets in specific circumstances. Only issuers can claw back tokens.

**Requires the Clawback amendment to be enabled.**

## Clawback Transaction Fields

### Required Fields:
- **Account**: The issuer account performing the clawback (string - address, required)
  - Must be the issuer of the token being clawed back
  - Must have Allow Trust Line Clawback setting enabled
- **Amount**: The amount being clawed back and the holder's account (currency amount, required)
  - **currency**: The currency code of the token, if it's not a standard currency code (more than 3 characters), you must use the currencyCodeToHexTool to convert it to a 160-bit hex value. (string)
  - **issuer**: The holder's account address (string - address)
  - **value**: The amount to claw back (string, must not be zero)
  - If amount exceeds holder's balance, entire balance is clawed back

### Optional Fields:
- **Holder**: Specifies the holder's address explicitly (string - address, optional)
  - Required for MPTokensV1 amendment
  - Holder must own MPToken object with non-zero balance
  - Must have tfMPTCanClawback flag set on MPToken
- **Fee**: Transaction cost in drops, typically autofill sets it (string, optional)
- **Sequence**: Account sequence number, typically autofill sets it (number, optional)
- **LastLedgerSequence**: Last ledger to process transaction, typically autofill sets it (number, optional)

## Clawback Setup Requirements

### Prerequisites for Issuer:
1. **Empty Owner Directory**: Account must have no trust lines, offers, escrows, payment channels, checks, or signer lists
2. **Enable Clawback**: Send AccountSet transaction with asfAllowTrustLineClawback flag
3. **Amendment Enabled**: Clawback amendment must be enabled on the network
4. **Irreversible Setting**: Once enabled, clawback cannot be disabled

### AccountSet to Enable Clawback:
\`\`\`json
{
  "TransactionType": "AccountSet",
  "Account": "rp6abvbTbjoce8ZDJkT6snvxTZSYMBCC9S",
  "SetFlag": 19,
  "Fee": "12"
}
\`\`\`

## Example Clawback Transactions

### Basic Trust Line Clawback:
\`\`\`json
{
  "TransactionType": "Clawback",
  "Account": "rp6abvbTbjoce8ZDJkT6snvxTZSYMBCC9S",
  "Amount": {
    "currency": "FOO",
    "issuer": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
    "value": "314.159"
  },
  "Fee": "12"
}
\`\`\`

### Clawback with Explicit Holder for MPTokens (MPT):
\`\`\`json
{
  "TransactionType": "Clawback",
  "Account": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
  "Amount": {
    "currency": "BAR",
    "issuer": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
    "value": "100.50"
  },
  "Holder": "rnpQ63kgk4Q3PnmUwdgpV5Q1e6NAgqdvL4",
  "Fee": "12"
}
\`\`\`

## Important Field Notes

### Amount Field Structure:
- **currency**: The token's currency code, if it's not a standard currency code (more than 3 characters), you must use the currencyCodeToHexTool to convert it to a 160-bit hex value. (e.g., "FOO", "USD")
- **issuer**: The holder's account address (NOT the issuer's address)
- **value**: Amount to claw back (string format, e.g., "314.159")

### Address Field Confusion:
- **Account field**: Contains the issuer's address (who is clawing back)
- **Amount.issuer field**: Contains the holder's address (who is losing tokens)
- This can be confusing because "issuer" in Amount refers to the token holder

### MPToken Support:
- **MPTokensV1 amendment**: Required for MPToken clawback
- **tfMPTCanClawback flag**: Must be set on MPToken during creation
- **Holder field**: Required when clawing back from MPTokens

## Error Conditions

### Amendment-Related Errors:
- **temDISABLED**: Clawback amendment is not enabled on the network

### Validation Errors:
- **temBAD_AMOUNT**: Holder's balance is 0, or issuer is trying to claw back from themselves
- **tecAMM_ACCOUNT**: Operation not allowed with AMM account (use AMMClawback instead)

### Permission Errors:
- **tecNO_LINE**: No trust line exists with the counterparty, or trust line balance is 0
- **tecNO_PERMISSION**: Cannot set lsfAllowTrustlineClawback while lsfNoFreeze is set, or vice versa

### Setup Errors:
- **tecINSUFFICIENT_RESERVE**: Account doesn't have enough XRP for transaction fee
- **tecUNFUNDED**: Account doesn't have enough XRP for reserve requirement

## Important Notes:

### Amendment Requirements:
- **Clawback**: Required for all clawback functionality
- **MPTokensV1**: Required for MPToken clawback operations

### Setup Requirements:
- **Empty Owner Directory**: Must have no existing ledger objects before enabling
- **Irreversible Setting**: Once enabled, cannot be disabled
- **No Existing Tokens**: Cannot enable if any tokens have been issued

### Clawback Behavior:
- **Partial Clawback**: Can claw back less than the full balance
- **Full Clawback**: If amount exceeds balance, entire balance is clawed back
- **Zero Balance**: Cannot claw back from accounts with zero balance
- **Self-Clawback**: Cannot claw back from your own account

### Trust Line vs MPToken:
- **Trust Lines**: Standard clawback from trust line balances
- **MPTokens**: Requires MPTokensV1 amendment and tfMPTCanClawback flag
- **Holder Field**: Required for MPToken clawback, optional for trust lines

### Security Considerations:
- **Irreversible Setting**: Once enabled, clawback cannot be disabled
- **Token Holder Impact**: Clawback immediately reduces holder's balance
- **Trust Implications**: Clawback can affect trust in the token issuer
- **Regulatory Compliance**: Ensure clawback usage complies with regulations

### Best Practices:
- **Clear Communication**: Inform token holders about clawback capabilities
- **Documentation**: Clearly document clawback policies and procedures
- **Limited Use**: Use clawback only in legitimate circumstances
- **Balance Monitoring**: Monitor token balances before clawback
- **Error Handling**: Handle cases where clawback amount exceeds balance

### Use Cases:
- **Regulatory Compliance**: Recover tokens for regulatory requirements
- **Fraud Prevention**: Recover tokens involved in fraudulent activities
- **Contract Enforcement**: Enforce contractual clawback provisions
- **Emergency Situations**: Recover tokens in emergency circumstances
- **MPToken Management**: Claw back MPTokens with proper authorization

### Legal and Regulatory Considerations:
- **Jurisdiction**: Ensure clawback complies with local regulations
- **Contract Terms**: Verify clawback is allowed under token terms
- **Holder Rights**: Consider impact on token holder rights
- **Transparency**: Maintain transparency about clawback policies
- **Documentation**: Keep records of all clawback transactions

### Technical Considerations:
- **Amendment Status**: Verify Clawback amendment is enabled
- **Account Setup**: Ensure proper account setup before enabling
- **Balance Verification**: Check holder balance before clawback
- **Trust Line Status**: Verify trust line exists and has balance
- **MPToken Flags**: Ensure MPTokens have tfMPTCanClawback flag

### Monitoring and Tracking:
- **Clawback History**: Track all clawback transactions
- **Balance Changes**: Monitor balance changes after clawback
- **Holder Impact**: Assess impact on affected token holders
- **Compliance Reporting**: Maintain records for regulatory reporting`,
  inputSchema: z.object({
    network: z.string(),
    txn: z.custom<Clawback>(),
    seed: z.string().optional(),
    signature: z.string().optional(),
  }),
  execute: async ({ context, mastra }) => {
    const { network, txn, seed, signature } = context

    return await submitTransaction({ network, txn, seed, mastra, signature })
  },
})
