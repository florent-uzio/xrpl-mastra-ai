import { convertStringToHex } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplAccountSetSchema } from './account-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplAccountSetSchema,
})

export const submitAccountSetTool = createTransactionTool({
  toolId: 'submit-account-set',
  description: `Submit an AccountSet transaction to the XRPL network. An AccountSet transaction modifies the properties of an account in the XRPL, allowing you to configure various account settings, flags, and metadata.

## ⚠️ IMPORTANT: Flag Usage Guidelines

**ALWAYS prefer SetFlag/ClearFlag over the Flags field for setting account flags.**

### Flag Setting Methods (in order of preference)
1. **SetFlag**: Set a single account flag (asf* flags) - **RECOMMENDED for most use cases**
2. **ClearFlag**: Clear a single account flag (asf* flags) - **RECOMMENDED for clearing flags**
3. **Flags**: Set multiple transaction flags at once (tf* flags only) - **ONLY use if you need to set multiple tf* flags simultaneously**

### Account Flags (asf*) - Use with SetFlag/ClearFlag Fields
| Flag Name | Value | Description |
|-----------|-------|-------------|
| asfRequireDest | 1 | Require destination tag for incoming payments |
| asfRequireAuth | 2 | Require authorization for issued tokens |
| asfDisallowXRP | 3 | Disallow XRP payments (advisory only) |
| asfDisableMaster | 4 | Disable master key pair |
| asfAccountTxnID | 5 | Track account's most recent transaction ID |
| asfNoFreeze | 6 | Permanently give up freeze abilities (irreversible) |
| asfGlobalFreeze | 7 | Freeze all assets issued by this account |
| asfDefaultRipple | 8 | Enable rippling on trust lines by default |
| asfDepositAuth | 9 | Require authorization for incoming payments |
| asfAuthorizedNFTokenMinter | 10 | Allow another account to mint NFTs |
| asfDisallowIncomingNFTokenOffer | 12 | Block incoming NFT offers |
| asfDisallowIncomingCheck | 13 | Block incoming Check objects |
| asfDisallowIncomingPayChan | 14 | Block incoming Payment Channels |
| asfDisallowIncomingTrustline | 15 | Block incoming trust lines |
| asfAllowTrustLineClawback | 16 | Allow clawback of issued tokens |
| asfAllowTrustLineLocking | 17 | Allow locking of trust lines |

### Transaction Flags (tf*) - Use with Flags Field (RARE CASES ONLY)
The following transaction flags can be combined using the Flags field, but this is rarely needed:

| Flag Name | Hex Value | Decimal Value | Replaced by AccountSet Flag |
|-----------|-----------|---------------|----------------------------|
| tfRequireDestTag | 0x00010000 | 65536 | asfRequireDest (SetFlag) |
| tfOptionalDestTag | 0x00020000 | 131072 | asfRequireDest (ClearFlag) |
| tfRequireAuth | 0x00040000 | 262144 | asfRequireAuth (SetFlag) |
| tfOptionalAuth | 0x00080000 | 524288 | asfRequireAuth (ClearFlag) |
| tfDisallowXRP | 0x00100000 | 1048576 | asfDisallowXRP (SetFlag) |
| tfAllowXRP | 0x00200000 | 2097152 | asfDisallowXRP (ClearFlag) |

**Usage Examples:**
- To require destination tags: \`SetFlag: 1\` (NOT \`Flags: 65536\`)
- To require auth for issued tokens: \`SetFlag: 2\` (NOT \`Flags: 262144\`)
- To disallow XRP: \`SetFlag: 3\` (NOT \`Flags: 1048576\`)
- To clear a flag: \`ClearFlag: 1\` (to remove destination tag requirement)

### Flag Behavior
- All flags are disabled by default
- Some flags are irreversible (asfNoFreeze, asfDisableMaster)
- **Use SetFlag/ClearFlag for individual flag operations (recommended)**
- Only use Flags field if you need to set multiple tf* flags in one transaction
- Multiple transactions may be needed to set multiple asf* flags

### Security Considerations
- **asfDisableMaster**: Permanently disables master key (use with extreme caution)
- **asfNoFreeze**: Permanently gives up freeze abilities (irreversible)
- **asfDepositAuth**: Blocks all incoming payments unless below reserve
- **asfRequireAuth**: Requires authorization for issued tokens
- **asfGlobalFreeze**: Freezes all assets issued by the account

### Error Conditions
- **tecNO_PERMISSION**: Cannot enable flag due to account state
- **tecINSUFFICIENT_RESERVE**: Account below reserve requirement
- **tecMASTER_DISABLED**: Master key disabled but required for operation
- **tecINSUFFICIENT_RESERVE**: Account below reserve requirement for flag changes`,
  buildTransaction: params => {
    return {
      ...params,
      Domain: params.Domain ? convertStringToHex(params.Domain) : undefined,
      TransactionType: 'AccountSet',
    }
  },
  validateTransaction: params => {
    if (params.TransferRate !== undefined && params.TransferRate < 1000000000) {
      throw new Error('TransferRate must be greater than or equal to 1000000000')
    }
    if (params.TransferRate !== undefined && params.TransferRate > 2000000000) {
      throw new Error('TransferRate must be less than or equal to 2000000000')
    }
    if (params.TickSize !== undefined && params.TickSize < 3) {
      throw new Error('TickSize must be greater than or equal to 3')
    }
    if (params.TickSize !== undefined && params.TickSize > 15) {
      throw new Error('TickSize must be less than or equal to 15')
    }
  },
})
