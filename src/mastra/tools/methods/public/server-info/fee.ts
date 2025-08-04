import { createTool } from '@mastra/core/tools'
import { FeeRequest, FeeResponse } from 'xrpl'
import { z } from 'zod'
import { mastra } from '../../../..'
import { disconnectXrplClient, getXrplClient } from '../../../../../helpers'

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
    opts: z.custom<FeeRequest>(),
  }),
  execute: async ({ context }) => {
    const { network, opts } = context

    const feeInfo = await getFee(network, opts)

    return feeInfo
  },
})

/**
 * Get fee information
 * @param network - The network to use
 * @param opts - The request options to use
 * @returns The fee information
 */
const getFee = async (network: string, opts: FeeRequest): Promise<FeeResponse> => {
  const client = await getXrplClient(network)

  const logger = mastra.getLogger()

  logger.info('Fee request', { url: client.url, opts: JSON.stringify(opts) })

  const response = await client.request({
    ...opts,
    command: 'fee',
  })

  // Disconnect the client
  await disconnectXrplClient(network)

  return response
}
