import { Agent } from '@mastra/core/agent'
import { ToolSearchProcessor } from '@mastra/core/processors'
import { LibSQLStore } from '@mastra/libsql'
import { Memory } from '@mastra/memory'
import {
  createWalletTool,
  currencyCodeToHexTool,
  decryptConfidentialBalanceTool,
  dropsToXrpTool,
  fundWalletWithFaucetTool,
  getAccountChannelsTool,
  getAccountCurrenciesTool,
  getAccountInfoTool,
  getAccountLinesTool,
  getAccountNFTsTool,
  getAccountObjectsTool,
  getAccountOffersTool,
  getAccountTxTool,
  getFeeTool,
  getFlowRecordsTool,
  getGatewayBalancesTool,
  getServerInfoTool,
  hexToCurrencyCodeTool,
  saveFlowRecordTool,
  submitAccountSetTool,
  submitAmmCreateTool,
  submitBatchTool,
  submitClawbackTool,
  submitConfidentialMPTClawbackTool,
  submitConfidentialMPTConvertBackTool,
  submitConfidentialMPTConvertTool,
  submitConfidentialMPTMergeInboxTool,
  submitConfidentialMPTSendTool,
  submitLoanBrokerCoverClawbackTool,
  submitLoanBrokerCoverDepositTool,
  submitLoanBrokerCoverWithdrawTool,
  submitLoanBrokerDeleteTool,
  submitLoanBrokerSetTool,
  submitLoanDeleteTool,
  submitLoanManageTool,
  submitLoanPayTool,
  submitLoanSetTool,
  submitMPTokenAuthorizeTool,
  submitMPTokenIssuanceCreateTool,
  submitMPTokenIssuanceDestroyTool,
  submitMPTokenIssuanceSetTool,
  submitNFTokenMintTool,
  submitOfferCancelTool,
  submitOfferCreateTool,
  submitPaymentTool,
  submitTrustSetTool,
  submitVaultClawbackTool,
  submitVaultCreateTool,
  submitVaultDeleteTool,
  submitVaultDepositTool,
  submitVaultSetTool,
  submitVaultWithdrawTool,
  xrpToDropsTool,
} from '../tools'
import { getStorageUrl } from '../../helpers'
import { confidentialMptWorkflow, iouIssuanceWorkflow, mptIssuanceWorkflow } from '../workflows'

// Always sent to the model: read-only lookups and unit/currency conversions.
const coreTools = {
  getAccountInfoTool,
  getAccountLinesTool,
  getAccountTxTool,
  getServerInfoTool,
  getFeeTool,
  currencyCodeToHexTool,
  decryptConfidentialBalanceTool,
  hexToCurrencyCodeTool,
  xrpToDropsTool,
  dropsToXrpTool,
}

// Loaded on demand: every other query tool, wallet/faucet tools and all transaction tools.
const searchableTools = {
  getAccountChannelsTool,
  getAccountCurrenciesTool,
  getAccountNFTsTool,
  getAccountObjectsTool,
  getAccountOffersTool,
  getGatewayBalancesTool,
  getFlowRecordsTool,
  saveFlowRecordTool,
  decryptConfidentialBalanceTool,
  createWalletTool,
  fundWalletWithFaucetTool,
  submitAccountSetTool,
  submitAmmCreateTool,
  submitBatchTool,
  submitClawbackTool,
  submitConfidentialMPTClawbackTool,
  submitConfidentialMPTConvertBackTool,
  submitConfidentialMPTConvertTool,
  submitConfidentialMPTMergeInboxTool,
  submitConfidentialMPTSendTool,
  submitLoanBrokerCoverClawbackTool,
  submitLoanBrokerCoverDepositTool,
  submitLoanBrokerCoverWithdrawTool,
  submitLoanBrokerDeleteTool,
  submitLoanBrokerSetTool,
  submitLoanDeleteTool,
  submitLoanManageTool,
  submitLoanPayTool,
  submitLoanSetTool,
  submitMPTokenAuthorizeTool,
  submitMPTokenIssuanceCreateTool,
  submitMPTokenIssuanceDestroyTool,
  submitMPTokenIssuanceSetTool,
  submitNFTokenMintTool,
  submitOfferCancelTool,
  submitOfferCreateTool,
  submitPaymentTool,
  submitTrustSetTool,
  submitVaultClawbackTool,
  submitVaultCreateTool,
  submitVaultDeleteTool,
  submitVaultDepositTool,
  submitVaultSetTool,
  submitVaultWithdrawTool,
}

// 'context' storage derives loaded tools from the conversation, so it survives restarts.
const toolSearchProcessor = new ToolSearchProcessor({ tools: searchableTools, storage: 'context' })

export const DEFAULT_MODEL: Agent['model'] = 'openai/gpt-5.4-mini'

export const xrplAgent = new Agent({
  id: 'xrpl-agent',
  name: 'XRP Ledger Agent',
  instructions: {
    role: 'system',
    content: `
    You are an XRP Ledger (XRPL) assistant. Use your tools to query accounts, servers and fees, convert values, and submit transactions.

    ## Networks
    - Default: mainnet via wss://xrplcluster.com/ (XRP Ledger Foundation, full history). Use the user's URL if they give one.
    - Testnet: wss://s.altnet.rippletest.net:51233/ (or wss://testnet.xrpl-labs.com/)
    - Devnet: wss://s.devnet.rippletest.net:51233/
    - Full history alternative: wss://s2.ripple.com/
    - Always connect with a WebSocket URL (wss://), never HTTP(S).
    - Say which network you used in every response.

    ## Transactions
    - Use the correct transaction type; Fee, Sequence and LastLedgerSequence are autofilled, so omit them.
    - Provide either a seed (testnet/devnet only) or a signature (mainnet), never both.
    - Non-standard currency codes (not 3 characters) must be 160-bit hex: use currencyCodeToHexTool.

    ## Faucet
    - Testnet/devnet networks only (testnet, devnet, sidechain-devnet, xahau-testnet). Never fund on mainnet.
    - If no wallet is given, the faucet tool creates one, so skip createWalletTool.

    ## Responses
    - Only XRP amounts are in drops (1 XRP = 1,000,000 drops): convert them to XRP for display. Trust line and token balances are not in drops.
    - Explain results in plain terms and explain errors clearly.
  `,
    // Anthropic only caches when asked. This caches the always-on tool definitions + instructions for 5 minutes.
    // OpenAI and Groq cache automatically and ignore this option.
    providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
  },
  // Model router id ("provider/model"). Evals pass a different one through requestContext to compare models.
  model: ({ requestContext }) => requestContext.get('model') ?? DEFAULT_MODEL,
  // Only the cheap, frequently used tools are sent on every request; the rest are found with search_tools and loaded with load_tool.
  tools: coreTools,
  inputProcessors: [toolSearchProcessor],
  workflows: {
    confidentialMptWorkflow,
    iouIssuanceWorkflow,
    mptIssuanceWorkflow,
  },
  memory: new Memory({
    storage: new LibSQLStore({
      id: 'xrpl-agent-memory',
      url: getStorageUrl(),
    }),
    options: {
      generateTitle: true,
    },
  }),
})
