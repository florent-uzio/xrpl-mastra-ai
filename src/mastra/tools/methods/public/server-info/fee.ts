import { createTool } from '@mastra/core/tools'
import { FeeRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getFeeTool = createTool({
  id: 'get-fee',
  description: `Get current transaction fee information for the XRP Ledger. This method reports the current state of the open-ledger requirements for transaction costs and requires the FeeEscalation amendment to be enabled.

Request Parameters:
- No parameters required (empty object)

The response includes:
- current_ledger_size: Number of transactions provisionally included in the in-progress ledger (string)
- current_queue_size: Number of transactions currently queued for the next ledger (string)
- drops: Object containing transaction cost information in drops of XRP:
  - base_fee: Transaction cost required for a reference transaction under minimum load (string)
  - median_fee: Approximation of median transaction cost from previous validated ledger (string)
  - minimum_fee: Minimum transaction cost for a reference transaction to be queued (string)
  - open_ledger_fee: Minimum transaction cost to be included in current open ledger (string)
- expected_ledger_size: Approximate number of transactions expected in current ledger (string)
- ledger_current_index: Ledger index of the current open ledger these stats describe (number)
- levels: Object containing transaction cost information in fee levels:
  - median_level: Median transaction cost from previous validated ledger (string)
  - minimum_level: Minimum transaction cost required to be queued for future ledger (string)
  - open_ledger_level: Minimum transaction cost required for current open ledger (string)
  - reference_level: Equivalent of minimum transaction cost (string)
- max_queue_size: Maximum number of transactions the transaction queue can currently hold (string)

Note: Fee levels represent the ratio of transaction cost relative to the minimum cost of that particular transaction. The FeeEscalation amendment must be enabled for this method to work.`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<FeeRequest>(),
  }),
  execute: async ({ context, mastra }) => {
    // Extract network and request from the context
    const { network, request } = context

    // Use the shared utility function to execute the fee command
    return await executeMethod({
      network,
      request: { ...request, command: 'fee' },
      logMessage: 'Fee request',
      mastra,
    })
  },
})
