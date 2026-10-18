import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { networkSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getServerDefinitionsTool = createTool({
  id: 'get-server-definitions',
  description: `Get the binary-serialization definitions of an XRPL server (the SDK-compatible definitions.json): fields, transaction and ledger entry formats, transaction flags, ledger entry flags and AccountSet flags. Use it to look up exact flag values or the fields of a transaction or ledger entry type on a given network.

The response is large. Pass the hash of a previous response to skip the full set when nothing changed.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      hash: z.string().optional().describe('If it matches the server hash, the full definitions are not returned'),
    }),
  }),
  outputSchema: xrplMethodResponse({
    FIELDS: z
      .array(z.unknown())
      .optional()
      .describe('[name, {isSerialized, isSigningField, isVLEncoded, nth, type}] pairs'),
    TRANSACTION_FORMATS: z.record(z.string(), z.unknown()).optional().describe('Fields per transaction type'),
    LEDGER_ENTRY_FORMATS: z.record(z.string(), z.unknown()).optional().describe('Fields per ledger entry type'),
    TRANSACTION_FLAGS: z.record(z.string(), z.unknown()).optional().describe('Flag values per transaction type'),
    LEDGER_ENTRY_FLAGS: z.record(z.string(), z.unknown()).optional().describe('Flag values per ledger entry type'),
    ACCOUNT_SET_FLAGS: z.record(z.string(), z.number()).optional().describe('asf* flag values'),
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the server_definitions command
    return await executeMethod({
      network,
      request: { ...request, command: 'server_definitions' },
      logMessage: 'Server definitions request',
      mastra,
    })
  },
})
