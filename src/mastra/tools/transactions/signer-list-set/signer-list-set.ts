import { SignerListSet } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplSignerListSetSchema } from './signer-list-set.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplSignerListSetSchema,
})

export const submitSignerListSetTool = createTransactionTool<SignerListSet>({
  toolId: 'submit-signer-list-set',
  description: `Submit a SignerListSet transaction to create, replace or delete the multi-signing list of the sender account.

To create or replace: set SignerQuorum (target weight sum, at least 1 and at most the total of all weights) and SignerEntries (1 to 32 entries of { SignerEntry: { Account, SignerWeight 1-65535, WalletLocator? } }). Signer accounts must be unique and cannot include the sender. A new list replaces any existing one.

To delete: set SignerQuorum to 0 and omit SignerEntries. Make sure the account still has a master key or regular key enabled, or it may become unusable.

The list requires an owner reserve. Common errors: temMALFORMED, temBAD_QUORUM (quorum above total weight), temBAD_SIGNER (duplicate or self), temBAD_WEIGHT, tecINSUFFICIENT_RESERVE, tecNO_ALTERNATIVE_KEY (deleting while the master key is disabled and no regular key is set).`,
  buildTransaction: params => {
    return params
  },
})
