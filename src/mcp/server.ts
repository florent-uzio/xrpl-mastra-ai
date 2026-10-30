import type { ToolsInput } from '@mastra/core/agent'
import { createTool } from '@mastra/core/tools'
import { MCPServer } from '@mastra/mcp'
import { z } from 'zod'
import packageJson from '../../packages/xrpl-mcp/package.json'
import { XRPL_INSTRUCTIONS } from '../mastra/instructions'
import * as toolsBarrel from '../mastra/tools'
import {
  confidentialMptWorkflow,
  iouIssuanceWorkflow,
  lendingSetupWorkflow,
  mptIssuanceWorkflow,
} from '../mastra/workflows'

// The tools barrel also exports schemas and helper functions: keep only the tools.
const isTool = (value: unknown) => typeof value === 'object' && value !== null && 'id' in value && 'execute' in value

// MCP clients do not hand the server version to the model: a tool is the only way to ask for it.
const getMcpVersionTool = createTool({
  id: 'get-mcp-version',
  description: 'Get the version of this XRPL MCP server (the @florent-uzio/xrpl-mcp npm package).',
  inputSchema: z.object({}),
  outputSchema: z.object({ name: z.string(), version: z.string() }),
  execute: async () => ({ name: packageJson.name, version: packageJson.version }),
})

const tools = {
  ...Object.fromEntries(Object.entries(toolsBarrel).filter(([, value]) => isTool(value))),
  getMcpVersionTool,
} as ToolsInput

// The MCP client has no Mastra working memory, so ledger facts go to flow records instead.
const MEMORY_INSTRUCTIONS = `
    ## Memory
    - Use get-flow-records before creating a wallet, token or MPT issuance, and reuse what you find.
    - Right after you create or learn something reusable (wallets, MPT issuance IDs, ElGamal keys, transaction hashes), save it with save-flow-record.
    - Show addresses by default; show seeds only when the user asks.
    - On mainnet, never store seeds or private keys: keep only the address and public keys.
`

export const xrplMcpServer = new MCPServer({
  id: 'xrpl-mcp',
  name: 'XRPL',
  version: packageJson.version,
  description: 'XRP Ledger tools and token issuance workflows',
  instructions: XRPL_INSTRUCTIONS + MEMORY_INSTRUCTIONS,
  tools,
  // Only tools and workflows: exposing the agent would trigger model calls on the owner's key.
  workflows: {
    'iou-issuance': iouIssuanceWorkflow,
    'mpt-issuance': mptIssuanceWorkflow,
    'confidential-mpt': confidentialMptWorkflow,
    'lending-setup': lendingSetupWorkflow,
  },
})
