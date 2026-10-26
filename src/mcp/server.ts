import type { ToolsInput } from '@mastra/core/agent'
import { MCPServer } from '@mastra/mcp'
import { XRPL_INSTRUCTIONS } from '../mastra/instructions'
import * as toolsBarrel from '../mastra/tools'
import { confidentialMptWorkflow, iouIssuanceWorkflow, mptIssuanceWorkflow } from '../mastra/workflows'

// The tools barrel also exports schemas and helper functions: keep only the tools.
const isTool = (value: unknown) => typeof value === 'object' && value !== null && 'id' in value && 'execute' in value

const tools = Object.fromEntries(Object.entries(toolsBarrel).filter(([, value]) => isTool(value))) as ToolsInput

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
  version: '1.0.0',
  description: 'XRP Ledger tools and token issuance workflows',
  instructions: XRPL_INSTRUCTIONS + MEMORY_INSTRUCTIONS,
  tools,
  // Only tools and workflows: exposing the agent would trigger model calls on the owner's key.
  workflows: {
    'iou-issuance': iouIssuanceWorkflow,
    'mpt-issuance': mptIssuanceWorkflow,
    'confidential-mpt': confidentialMptWorkflow,
  },
})
