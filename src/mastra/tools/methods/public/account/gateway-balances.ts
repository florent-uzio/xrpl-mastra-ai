import { createTool } from '@mastra/core/tools'
import { GatewayBalancesRequest } from 'xrpl'
import { z } from 'zod'
import { disconnectXrplClient, getXrplClient } from '../../../../../helpers'

export const getGatewayBalancesTool = createTool({
  id: 'get-gateway-balances',
  description: `Calculate the total balances issued by a given account, optionally excluding amounts held by operational addresses. This method is useful for gateway operators to track their total obligations and balances across multiple operational addresses.

Caution: Some public servers disable this API method because it can require a large amount of processing.

Request Parameters:
- account: The address to check, should be the issuing address (string - address, required)
- strict: If true, only accept an address or public key for the account parameter (boolean, optional, default: false)
- hotwallet: An operational address to exclude from balances issued, or an array of such addresses (string or array, optional)
- ledger_hash: The unique hash of the ledger version to use (string, optional)
- ledger_index: The ledger index to use, or shortcut string like "validated" (string or unsigned integer, optional)

The response includes:
- account: The address of the account that issued the balances (string - address)
- obligations: Total amounts issued to addresses not excluded, as a map of currencies to total value issued (object, omitted if empty)
- balances: Amounts issued to the hotwallet addresses from the request, keys are addresses and values are arrays of currency amounts they hold (object, omitted if empty)
- assets: Total amounts held that are issued by others, in recommended configuration the issuing address should have none (object, omitted if empty)
- ledger_hash: The identifying hash of the ledger version used to generate this response (string, optional)
- ledger_index: The ledger index of the ledger version used to generate this response (number, optional)
- ledger_current_index: The ledger index of the current in-progress ledger version used to retrieve this information (number, omitted if ledger_current_index is provided)

Important Notes:
- This method calculates total balances issued by the specified account
- Hotwallet addresses can be excluded from the calculation to focus on external obligations
- The obligations field shows total amounts issued to non-hotwallet addresses
- The balances field shows amounts held by specified hotwallet addresses
- The assets field shows amounts held that are issued by other accounts
- Some public servers disable this method due to high processing requirements
- In recommended configuration, the issuing address should have no assets field

Possible Errors:
- invalidParams: One or more fields are specified incorrectly, or one or more required fields are missing
- invalidHotWallet: One or more of the addresses specified in the hotwallet field is not the Address of an account holding currency issued by the account from the request
- actNotFound: The Address specified in the account field of the request does not correspond to an account in the ledger
- lgrNotFound: The ledger specified by the ledger_hash or ledger_index does not exist, or it does exist but the server does not have it
- Any of the universal error types

Note: Due to a discrepancy in behavior between the Clio server and rippled (fixed in Clio version 2.3.1), the Clio server returns invalidParams error in API v2 instead of invalidHotWallet when the hotwallet field is invalid. API v1 returns the invalidHotWallet error.`,
  inputSchema: z.object({
    network: z.string(),
    opts: z.custom<GatewayBalancesRequest>(),
  }),
  execute: async ({ context, mastra }) => {
    const { network, opts } = context

    const client = await getXrplClient(network)

    const logger = mastra?.getLogger()

    logger?.info('Gateway balances request', { url: client.url, opts: JSON.stringify(opts) })

    const response = await client.request({
      ...opts,
      command: 'gateway_balances',
    })

    // Disconnect the client
    await disconnectXrplClient(network)

    return response
  },
})
