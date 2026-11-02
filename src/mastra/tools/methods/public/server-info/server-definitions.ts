import { z } from 'zod'
import { defineMethodTool } from '../../shared'

export const getServerDefinitionsTool = defineMethodTool({
  id: 'get-server-definitions',
  command: 'server_definitions',
  description: `Get the binary-serialization definitions of an XRPL server (the SDK-compatible definitions.json): fields, transaction and ledger entry formats, transaction flags, ledger entry flags and AccountSet flags. Use it to look up exact flag values or the fields of a transaction or ledger entry type on a given network.

The response is large. Pass the hash of a previous response to skip the full set when nothing changed.`,
  request: z.object({
    hash: z.string().optional().describe('If it matches the server hash, the full definitions are not returned'),
  }),
  result: {
    FIELDS: z
      .array(z.unknown())
      .optional()
      .describe('[name, {isSerialized, isSigningField, isVLEncoded, nth, type}] pairs'),
    TRANSACTION_FORMATS: z.record(z.string(), z.unknown()).optional().describe('Fields per transaction type'),
    LEDGER_ENTRY_FORMATS: z.record(z.string(), z.unknown()).optional().describe('Fields per ledger entry type'),
    TRANSACTION_FLAGS: z.record(z.string(), z.unknown()).optional().describe('Flag values per transaction type'),
    LEDGER_ENTRY_FLAGS: z.record(z.string(), z.unknown()).optional().describe('Flag values per ledger entry type'),
    ACCOUNT_SET_FLAGS: z.record(z.string(), z.number()).optional().describe('asf* flag values'),
  },
})
