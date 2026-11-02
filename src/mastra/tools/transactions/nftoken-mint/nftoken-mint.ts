import { convertStringToHex, NFTokenMint } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplNFTokenMintSchema } from './nftoken-mint.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplNFTokenMintSchema,
})

export const submitNFTokenMintTool = createTransactionTool<NFTokenMint>({
  toolId: 'submit-nftoken-mint',
  description: `Submit an NFTokenMint transaction to create an NFT. Flags are immutable after minting.

Flags: tfBurnable (1), tfOnlyXRP (2), tfTransferable (8), tfMutable (16). tfTrustLine (4) is deprecated.

Rules:
- NFTokenTaxon identifies the collection (0 is fine).
- TransferFee is 0-50000 (50000 = 50%) and requires tfTransferable.
- URI is plain text here. It is hex-encoded automatically (max 256 bytes after encoding).
- Issuer requires NFTokenMinter authorization from that account.
- Amount, Destination and Expiration create a sell offer at mint time. Destination and Expiration require Amount.`,
  buildTransaction: nftokenMint => {
    const { Amount, URI, NFTokenTaxon, ...rest } = nftokenMint

    return {
      Amount,
      URI: URI && convertStringToHex(URI),
      NFTokenTaxon: NFTokenTaxon ?? 0,
      ...rest,
    }
  },
})
