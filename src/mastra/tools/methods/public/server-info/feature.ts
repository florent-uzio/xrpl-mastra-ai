import { z } from 'zod'
import { defineMethodTool } from '../../shared'

export const getFeatureTool = defineMethodTool({
  id: 'get-feature',
  command: 'feature',
  description: `Get the status of XRPL protocol amendments: whether each is enabled in the latest ledger and whether the server supports it. Pass a name or ID to check one amendment, or omit it to list all.

The result is a map keyed by amendment ID. An amendment that is enabled but not supported can make the server amendment blocked.`,
  request: z.object({
    feature: z.string().optional().describe('Amendment ID (hex) or short name. Omit to list all amendments'),
  }),
  // Amendment IDs are dynamic keys, so the extra fields are kept by the loose result
  result: {},
})
