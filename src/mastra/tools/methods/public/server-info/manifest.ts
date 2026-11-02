import { z } from 'zod'
import { defineMethodTool } from '../../shared'

export const getManifestTool = defineMethodTool({
  id: 'get-manifest',
  command: 'manifest',
  description: `Look up the public manifest of a known XRPL validator: its domain, master key, ephemeral (signing) key and manifest sequence number. Details are omitted if the server has no manifest for the key.`,
  request: z.object({
    public_key: z.string().describe('Base58 validator key, either the master or the ephemeral public key'),
  }),
  result: {
    details: z
      .looseObject({
        domain: z.string(),
        ephemeral_key: z.string(),
        master_key: z.string(),
        seq: z.number(),
      })
      .partial()
      .optional()
      .describe('Manifest data, omitted if no manifest is known'),
    manifest: z.string().optional().describe('Full manifest, base64-encoded'),
    requested: z.string().optional().describe('The public_key from the request'),
  },
})
