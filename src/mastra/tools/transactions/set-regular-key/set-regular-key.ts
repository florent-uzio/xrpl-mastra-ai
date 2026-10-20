import { SetRegularKey } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplSetRegularKeySchema } from './set-regular-key.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplSetRegularKeySchema,
})

export const submitSetRegularKeyTool = createTransactionTool<SetRegularKey>({
  toolId: 'submit-set-regular-key',
  description: `Submit a SetRegularKey transaction to assign, change or remove the regular key pair of the sender account.

RegularKey is the r-address derived from the new key pair; it can then sign transactions in place of the master key. Omitting RegularKey removes the existing regular key. The sender may sign this transaction with the master key for free once (the fee can be waived if lsfPasswordSpent is not set).

Warning: removing the regular key while the master key is disabled (asfDisableMaster) leaves the account unable to sign. Common errors: temBAD_REGKEY (RegularKey is the account itself), tecNO_ALTERNATIVE_KEY.`,
  buildTransaction: params => {
    return params
  },
})
