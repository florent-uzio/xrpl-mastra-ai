import { Amount, convertStringToHex } from 'xrpl'
import { isIssuedCurrency } from 'xrpl/dist/npm/models/transactions/common'
import { currencyCodeToHex, isString } from '../../../../helpers'
import { useTransactionToolFactory } from '../factory'
import { xrplNFTokenMintSchema } from './nftoken-mint.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplNFTokenMintSchema,
})

/**
 * Helper function to process NFTokenMint Amount field
 * Handles string amounts (XRP) and currency objects (tokens)
 */
const processNFTokenAmount = (amount: Amount): Amount => {
  // If it's a string (XRP amount in drops), return as is
  if (isString(amount)) {
    return amount
  }

  // If it's a currency object, convert currency to hex and return
  if (isIssuedCurrency(amount)) {
    return {
      ...amount,
      currency: currencyCodeToHex(amount.currency),
    }
  }

  // Return as is for any other case
  return amount
}

export const submitNFTokenMintTool = createTransactionTool({
  toolId: 'submit-nftoken-mint',
  description: `Submit an NFTokenMint transaction to create a new non-fungible token (NFT) on the XRPL.

## What is NFTokenMint?
Creates a new NFT and adds it to the NFTokenPage object of the NFTokenMinter. This is the only opportunity to specify immutable token fields like TokenFlags.

## Required Fields:
- **NFTokenTaxon**: Arbitrary taxon/identifier for NFT series or collection (number)

## Optional Fields:
- **Issuer**: Account to issue NFT on behalf of (string, requires NFTokenMinter authorization)
- **TransferFee**: Fee for secondary sales (number, 0-50000, requires tfTransferable flag)
- **URI**: Hex-encoded metadata, this will be encoded by the mastra tool (string, max 256 bytes)
- **Amount**: Expected/offered amount (XRP string or token object)
- **Expiration**: Offer expiration time in seconds since Ripple Epoch (number)
- **Destination**: Account that can accept the offer (string)

## NFTokenMint Flags:
- **tfBurnable** (1): Allow issuer to destroy the NFT
- **tfOnlyXRP** (2): Only XRP payments allowed
- **tfTrustLine** (4): DEPRECATED - Auto-create trust lines
- **tfTransferable** (8): Allow transfers to others (required for TransferFee)
- **tfMutable** (16): Allow URI updates via NFTokenModify

## Important Notes:
- **TransferFee**: Requires tfTransferable flag when > 0
- **Expiration/Destination**: Require Amount field to be specified
- **Amount**: Must be non-zero for tokens, zero allowed for XRP
- **URI**: Must be hex-encoded, max 256 bytes (512 hex characters)
- **Issuer Delegation**: Requires NFTokenMinter account setting

## Common Error Cases:
- **temDISABLED**: NonFungibleTokensV1 amendment not enabled
- **temBAD_NFTOKEN_TRANSFER_FEE**: TransferFee outside 0-50000 range
- **temINVALID_FLAG**: Invalid flag combination
- **temMALFORMED**: URI too long or invalid specification
- **tecNO_ISSUER**: Issuer account doesn't exist
- **tecNO_PERMISSION**: No NFTokenMinter authorization
- **tecINSUFFICIENT_RESERVE**: Account below reserve requirement
- **tecMAX_SEQUENCE_REACHED**: Maximum NFTs already minted

## Example Usage:
\`\`\`json
{
  "Account": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
  "NFTokenTaxon": 0,
  "TransferFee": 314,
  "Flags": 8,
  "URI": "697066733A2F2F62616679626569676479727A74357366703775646D37687537367568377932366E6634646675796C71616266336F636C67747179353566627A6469",
  "TransactionType": "NFTokenMint"
}
\`\`\`

**Note**: This creates a transferable NFT with 0.0314% transfer fee and IPFS metadata.`,
  buildTransaction: nftokenMint => {
    const { Amount, URI, NFTokenTaxon, ...rest } = nftokenMint

    return {
      Amount: Amount && processNFTokenAmount(Amount),
      URI: URI && convertStringToHex(URI),
      NFTokenTaxon: NFTokenTaxon ?? 0,
      ...rest,
    }
  },
})
