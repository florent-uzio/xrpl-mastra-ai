import { NFTokenModify } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplNFTokenModifySchema } from './nftoken-modify.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplNFTokenModifySchema,
})

export const submitNFTokenModifyTool = createTransactionTool<NFTokenModify>({
  toolId: 'submit-nftoken-modify',
  description: `Submit an NFTokenModify transaction to change or clear the URI of a mutable NFT. No flags. Requires the DynamicNFT amendment.

The NFT must have been minted with tfMutable. Only the issuer or its authorized NFTokenMinter can modify it. If the NFT is held by another account, set Owner to that holder.

URI here must already be hex-encoded (max 256 bytes, not empty). Set URI to null to remove it. Omit it to leave it unchanged.

Errors: tecNO_ENTRY (NFT not found), tecNO_PERMISSION (not mutable or sender not issuer/minter).`,
  buildTransaction: nftokenModify => {
    return nftokenModify
  },
})
