import { Agent } from '@mastra/core/agent'
import { ToolSearchProcessor } from '@mastra/core/processors'
import { LibSQLStore } from '@mastra/libsql'
import { Memory } from '@mastra/memory'
import { coreTools, searchableTools, workflows } from '../catalog'
import { XRPL_INSTRUCTIONS } from '../instructions'
import { getStorageUrl } from '../../helpers'
import { workingMemorySchema } from '../memory/working-memory'
import { stripReasoningProcessor } from '../processors/strip-reasoning'

// 'context' storage derives loaded tools from the conversation, so it survives restarts.
const toolSearchProcessor = new ToolSearchProcessor({ tools: searchableTools, storage: 'context' })

export const DEFAULT_MODEL: Agent['model'] = 'anthropic/claude-haiku-5-5'

export const xrplAgent = new Agent({
  id: 'xrpl-agent',
  name: 'XRP Ledger Agent',
  instructions: {
    role: 'system',
    content: `${XRPL_INSTRUCTIONS}
    ## Memory
    - Your working memory persists across the conversation. Update it right after you create or learn something reusable: wallets (address, plus seed on testnet/devnet only), MPT issuance IDs, ElGamal keys, the network in use, other IDs or hashes you will need later.
    - Check it before asking the user for a value or creating a new one.
    - On mainnet, never store seeds or private keys: keep only the address and public keys.
  `,
    // Anthropic only caches when asked. This caches the always-on tool definitions + instructions for 5 minutes.
    // OpenAI and Groq cache automatically and ignore this option.
    providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
  },
  // Model router id ("provider/model"). Evals pass a different one through requestContext to compare models.
  model: ({ requestContext }) => requestContext.get('model') ?? DEFAULT_MODEL,
  // Only the cheap, frequently used tools are sent on every request; the rest are found with search_tools and loaded with load_tool.
  tools: coreTools,
  inputProcessors: [toolSearchProcessor, stripReasoningProcessor],
  // Thinking is off: its signed blocks break when the tool list changes mid-conversation (see stripReasoningProcessor).
  defaultOptions: { providerOptions: { anthropic: { thinking: { type: 'disabled' } } } },
  workflows,
  memory: new Memory({
    storage: new LibSQLStore({
      id: 'xrpl-agent-memory',
      url: getStorageUrl(),
    }),
    options: {
      generateTitle: true,
      // Resource scope: shared by every thread of the same resourceId, so a wallet survives a new thread.
      workingMemory: { enabled: true, scope: 'resource', schema: workingMemorySchema },
    },
  }),
})
