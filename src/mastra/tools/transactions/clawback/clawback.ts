import { useTransactionToolFactory } from '../factory'
import { xrplClawbackSchema } from './clawback.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplClawbackSchema,
})

export const submitClawbackTool = createTransactionTool({
  toolId: 'submit-clawback',
  description: `Submit a Clawback transaction to recover tokens issued by your account from a holder's account.

## What is Clawback?
Clawback allows token issuers to recover (claw back) tokens they have issued from holders' accounts. This is primarily used for regulatory compliance, such as recovering tokens sent to sanctioned accounts or addressing illegal activity.

## Prerequisites:
- **Clawback Amendment**: Must be enabled on the network
- **Account Setup**: Issuer must have enabled "Allow Trust Line Clawback" flag (asfAllowTrustLineClawback = 16)
- **Empty Owner Directory**: Clawback can only be enabled before any trust lines, offers, escrows, etc.
- **No NoFreeze Flag**: Cannot have both clawback and NoFreeze enabled (mutually exclusive)
- **Permanent Setting**: Once enabled, clawback cannot be disabled

## Required Fields:
- **Amount**: Currency amount object containing:
  - currency: Token currency code (cannot be XRP)
  - value: Amount to claw back (must be > 0)
  - issuer: Token holder's address (the account to claw back from)

## Optional Fields:
- **Holder**: MPToken holder address (requires MPTokensV1 amendment)

## Important Notes:
- **XRP Exclusion**: Cannot claw back XRP - only issued tokens
- **Field Confusion**: The issuer field in Amount represents the token holder, not the issuer
- **Partial Clawback**: If amount exceeds holder's balance, entire balance is clawed back
- **Self-Clawback Prevention**: Cannot claw back from yourself
- **AMM Accounts**: Use AMMClawback instead for AMM accounts

## Common Error Cases:
- **temDISABLED**: Clawback amendment not enabled
- **temBAD_AMOUNT**: Holder's balance is 0 or self-clawback attempt
- **tecAMM_ACCOUNT**: Not allowed with AMM accounts
- **tecNO_LINE**: No trust line exists or balance is 0
- **tecNO_PERMISSION**: Clawback not enabled or conflicting flags

## Example Usage:
\`\`\`json
{
  "Account": "rp6abvbTbjoce8ZDJkT6snvxTZSYMBCC9S",
  "Amount": {
    "currency": "FOO",
    "issuer": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
    "value": "314.159"
  },
  "TransactionType": "Clawback"
}
\`\`\`

**Note**: This claws back 314.159 FOO tokens from holder rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW.`,
  buildTransaction: clawback => {
    return clawback
  },
  validateTransaction: params => {
    if (!params.Amount || parseFloat(params.Amount.value) <= 0) {
      throw new Error('Amount value must be greater than zero')
    }

    if (params.Amount.currency.toUpperCase() === 'XRP') {
      throw new Error('Clawback cannot be used with XRP - only issued tokens can be clawed back')
    }

    if (params.Amount.issuer === params.Account) {
      throw new Error('Cannot claw back from yourself - the holder cannot be the same as the Account')
    }
  },
})
