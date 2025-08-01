import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { LibSQLStore } from '@mastra/libsql'
import { Memory } from '@mastra/memory'
import {
  dropsToXrpTool,
  getAccountInfoTool,
  getAccountLinesTool,
  getAccountNFTsTool,
  getAccountObjectsTool,
  isClientConnectedTool,
  xrpToDropsTool,
} from '../tools'

export const xrplAgent = new Agent({
  name: 'XRP Ledger Agent',
  instructions: `
    You are a helpful assistant that can help with XRP Ledger related tasks.

    You can use the following tools below to help you.

    Public methods:
    - getAccountInfo to retrieve information about an XRP Ledger account.
    - getAccountLines to retrieve information about an XRP Ledger account lines.
    - getAccountNFTs to retrieve information about an XRP Ledger account NFTs.
    - getAccountObjects to retrieve information about an XRP Ledger account objects.

    Client helpers:
    - isClientConnected to check if the client is connected to the XRP Ledger.

    Amount helpers:
    - xrpToDrops to convert an XRP amount to drops.
    - dropsToXrp to convert a drops amount to XRP.

    ** Networks **
    
    There are three kind of networks for the XRP Ledger:
    - commercial
    - non-commercial
    - test networks
    
    You can find the WebSocket urls for each network at https://xrpl.org/docs/tutorials/public-servers#public-servers

    By default use the mainnet non-commercial network with the operator called 'XRP Ledger Foundation' WebSocket url: wss://xrplcluster.com/.

    Always indicate which network you are using in your response with the websocket URL, except if the user asks you not to.

    The network is needed for the XRPL Client, you pass the string URL to the constructor of the Client class.
    If the user defines its own wss url, use it.
`,
  model: openai('gpt-4o-mini'),
  tools: {
    // Public methods
    getAccountInfoTool,
    getAccountLinesTool,
    getAccountNFTsTool,
    getAccountObjectsTool,

    // Client helpers
    isClientConnectedTool,

    // Amount helpers
    xrpToDropsTool,
    dropsToXrpTool,
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
})
