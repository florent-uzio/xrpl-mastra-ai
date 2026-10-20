import { NFTokenBurn } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplNFTokenBurnSchema } from './nftoken-burn.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplNFTokenBurnSchema,
})

export const submitNFTokenBurnTool = createTransactionTool<NFTokenBurn>({
  toolId: 'submit-nftoken-burn',
  description: `Submit an NFTokenBurn transaction to permanently destroy an NFT. No flags.

NFTokenID is 64 hex characters. The owner can always burn their own NFT. The issuer (or an authorized minter) can burn an NFT owned by someone else by setting Owner, but only if it was minted with tfBurnable. Burning also removes any offers for the token.

Errors: tecNO_ENTRY (NFT not found for that owner), tecNO_PERMISSION (not owner and token is not burnable or sender is not the issuer/minter).`,
  buildTransaction: nftokenBurn => {
    return nftokenBurn
  },
})
