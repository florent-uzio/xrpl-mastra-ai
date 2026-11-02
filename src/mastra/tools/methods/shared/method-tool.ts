import { createTool } from '@mastra/core/tools'
import { Request } from 'xrpl'
import { z } from 'zod'
import { getXrplClient, networkSchema } from '../../../../helpers'
import { encodeCurrencyCodesDeep } from '../../transactions/shared'
import { xrplMethodResponse } from './response'

type MethodToolConfig<TRequest extends z.ZodObject, TResult extends z.ZodRawShape> = {
  id: string
  /** The rippled command, e.g. "account_info". */
  command: string
  description: string
  /** Schema of the request fields (without command). */
  request: TRequest
  /** The useful fields of the response's result; see xrplMethodResponse. */
  result: TResult
}

/**
 * A read-only XRPL method tool. Input is `{ network, request }`. The request's currency codes are hex-encoded (any
 * depth), then `{ ...request, command }` is sent to the network and the raw server response is returned.
 */
export const defineMethodTool = <TRequest extends z.ZodObject, TResult extends z.ZodRawShape>({
  id,
  command,
  description,
  request,
  result,
}: MethodToolConfig<TRequest, TResult>) =>
  createTool({
    id,
    description,
    inputSchema: z.object({ network: networkSchema, request }),
    outputSchema: xrplMethodResponse(result),
    // The schema documents the response; a server answer that differs is logged, never rejected
    outputValidation: 'warn',
    execute: async (inputData, { mastra }) => {
      // TS cannot narrow a generic zod object, so name the two fields it always has
      const { network, request } = inputData as { network: string; request: object }
      const client = await getXrplClient(network, mastra)
      const sent = { ...encodeCurrencyCodesDeep(request), command }
      mastra?.getLogger()?.info(`${command} request`, { url: client.url, opts: JSON.stringify(sent) })
      // command is checked by the tests, not the type: xrpl.js does not type every command (e.g. version)
      return await client.request(sent as unknown as Request)
    },
  })
