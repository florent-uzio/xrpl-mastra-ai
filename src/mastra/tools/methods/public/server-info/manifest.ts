import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { networkSchema } from '../../../../../helpers'
import { executeMethod, xrplMethodResponse } from '../../shared'

export const getManifestTool = createTool({
  id: 'get-manifest',
  description: `Look up the public manifest of a known XRPL validator: its domain, master key, ephemeral (signing) key and manifest sequence number. Details are omitted if the server has no manifest for the key.`,
  inputSchema: z.object({
    network: networkSchema,
    request: z.object({
      public_key: z.string().describe('Base58 validator key, either the master or the ephemeral public key'),
    }),
  }),
  outputSchema: xrplMethodResponse({
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
  }),
  outputValidation: 'warn',
  execute: async (inputData, { mastra }) => {
    // Extract network and request from the context
    const { network, request } = inputData

    // Use the shared utility function to execute the manifest command
    return await executeMethod({
      network,
      request: { ...request, command: 'manifest' },
      logMessage: 'Manifest request',
      mastra,
    })
  },
})
