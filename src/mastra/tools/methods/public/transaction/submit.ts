import { z } from 'zod'
import { defineMethodTool } from '../../shared'

export const submitSignedBlobTool = defineMethodTool({
  id: 'submit-signed-blob',
  command: 'submit',
  description: `Submit an already signed transaction, given as a hex tx_blob, to the network. Use it when the user provides a pre-signed blob (e.g. signed offline or by a custody/HSM). To build, autofill and sign a transaction from fields, use the submit-* transaction tools instead.

A tesSUCCESS engine_result only means the transaction was applied to the open ledger: it is final once validated. Confirm with get-tx using the returned hash. Submitting is irreversible on mainnet.`,
  request: z.object({
    tx_blob: z
      .string()
      .regex(/^[0-9A-Fa-f]+$/, 'Must be a hex string')
      .describe('Signed transaction as a hex blob'),
    fail_hard: z
      .boolean()
      .optional()
      .describe('If true, do not relay the transaction when it fails its local checks (default false)'),
  }),
  result: {
    engine_result: z.string().optional().describe('Preliminary result, e.g. "tesSUCCESS", "tecUNFUNDED_PAYMENT"'),
    engine_result_message: z.string().optional(),
    accepted: z.boolean().optional().describe('true if the server accepted the transaction for processing'),
    applied: z.boolean().optional(),
    broadcast: z.boolean().optional(),
    kept: z.boolean().optional(),
    queued: z.boolean().optional(),
    tx_blob: z.string().optional(),
    tx_json: z.looseObject({ hash: z.string().optional() }).optional(),
    validated_ledger_index: z.number().optional(),
  },
})
