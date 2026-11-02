import { Tool } from '@mastra/core/tools'
import * as toolsBarrel from './tools'
import {
  currencyCodeToHexTool,
  dropsToXrpTool,
  getAccountInfoTool,
  getServerInfoTool,
  hexToCurrencyCodeTool,
  xrpToDropsTool,
} from './tools'
import { confidentialMptWorkflow, iouIssuanceWorkflow, lendingSetupWorkflow, mptIssuanceWorkflow } from './workflows'

/**
 * The single list of tools and workflows. The agent, the MCP server and the Mastra instance all read from it.
 * Tool keys are the tool names the model sees (and the evals expect), so they never change.
 */

// Always sent to the model: read-only lookups and unit/currency conversions.
export const coreTools = {
  getAccountInfoTool,
  getServerInfoTool,
  currencyCodeToHexTool,
  hexToCurrencyCodeTool,
  xrpToDropsTool,
  dropsToXrpTool,
}

// The tools barrel also exports schemas and helper functions: keep only the tools.
const exportedTools = Object.entries(toolsBarrel).filter(
  (entry): entry is [string, Tool<any, any, any, any>] => entry[1] instanceof Tool,
)

// Loaded on demand: every other tool exported by src/mastra/tools. Exporting a tool is enough to add it here.
export const searchableTools = Object.fromEntries(exportedTools.filter(([name]) => !(name in coreTools)))

export const allTools = { ...coreTools, ...searchableTools }

// One key per workflow. The MCP server exposes each one as run_<key>; the agent as workflow-<key>.
export const workflows = {
  'iou-issuance': iouIssuanceWorkflow,
  'mpt-issuance': mptIssuanceWorkflow,
  'confidential-mpt': confidentialMptWorkflow,
  'lending-setup': lendingSetupWorkflow,
}
