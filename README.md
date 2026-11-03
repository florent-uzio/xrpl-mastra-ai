# XRPL Mastra AI

XRP Ledger tools, workflows and an agent built with [Mastra](https://mastra.ai/) and [xrpl.js](https://js.xrpl.org/).

- **122 tools**:
  - query the ledger (accounts, ledgers, transactions, order books, AMMs, NFTs, vaults, servers, fees)
  - submit the XRPL transaction types (payments, trust lines, DEX offers, AMMs, NFTs, MPTs, escrows, checks, payment channels, credentials, vaults, lending, oracles, batches, confidential MPTs)
  - create and fund wallets
  - convert units and currency codes
- **4 workflows** for multi-step setups on test networks: IOU issuance, MPT issuance, confidential MPT and lending setup.
- **An agent** that uses them in Mastra Studio.
- **An MCP server**, [`@florent-uzio/xrpl-mcp`](https://www.npmjs.com/package/@florent-uzio/xrpl-mcp), that gives the same tools and workflows to Claude Code.

## Use it from Claude Code (MCP server)

You only need Node.js 22.13 or later. No model API key is required: the server exposes the tools and workflows, not the agent, so Claude Code does the reasoning.

```bash
claude mcp add xrpl -- npx -y @florent-uzio/xrpl-mcp
```

Then ask Claude things like "What is the balance of rXXX on mainnet?" or "Issue an MPT on testnet with 2 holders".

<details>
<summary>The new version isn't picked up</summary>

`npx` loads a new release the next time Claude Code starts the server: start a new session, or reconnect `xrpl` from `/mcp`.

If you still get the old version, or `No matching version found`, your npm cache is outdated. Refresh it once (the server then waits for input, stop it with Ctrl+C), then reconnect:

```bash
npx -y --prefer-online @florent-uzio/xrpl-mcp
```

</details>

To run the server from a clone of this repo instead:

```bash
claude mcp add xrpl -- npm --prefix "$(pwd)" run --silent mcp
```

## Use the agent in Mastra Studio

```bash
cp .env.example .env   # set ANTHROPIC_API_KEY
npm install
npm run dev            # opens Mastra Studio
```

The agent uses `anthropic/claude-haiku-5-5` by default (`DEFAULT_MODEL` in `src/mastra/agents/xrpl-agent.ts`).

The agent always has 6 core tools: account info, server info, and the XRP and currency code conversions. It finds and loads the other tools on demand, with Mastra's `ToolSearchProcessor`.

## Networks and secrets

- Mainnet is the default. Say "testnet" or "devnet", or give a `wss://` URL, to use another network. Every known network is listed in `src/helpers/networks.ts`.
- **Seeds are refused outside test networks**, before any connection is made. On mainnet, sign the transaction yourself and submit the blob with `submit-signed-blob`.
- **Flow records** keep what a session creates (wallets, MPT IDs, keys, hashes), so a later session can reuse it. `save-flow-record` refuses seeds and private keys on mainnet.

| Variable                   | Purpose                                                                                                                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`        | Model key for the agent and the evals. `OPENAI_API_KEY` and `GROQ_API_KEY` are only needed to try other models.                                                                                                                   |
| `XRPL_RECORDS_DIR`         | Folder for flow records. The MCP server defaults to `~/.xrpl-mastra-ai/records`. Set the same folder in `.env` so Studio shares the records.                                                                                      |
| `XRPL_EXTRA_TEST_NETWORKS` | Comma-separated URLs of other test networks where seeds are allowed, e.g. a local node. Pass it to the MCP server with `claude mcp add xrpl --env XRPL_EXTRA_TEST_NETWORKS=ws://localhost:6006 -- npx -y @florent-uzio/xrpl-mcp`. |

## Workflows

The MCP server exposes each workflow as `run_<name>`. The agent sees it as `workflow-<name>`.

| Workflow           | Network         | What it does                                                                                                                                                     |
| ------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `iou-issuance`     | testnet, devnet | Funds an issuer and holders, configures the issuer, creates the trust lines and sends the token to each holder.                                                  |
| `mpt-issuance`     | testnet, devnet | Funds an issuer and holders, creates the MPT issuance (flags, scale, metadata), opts the holders in and sends them the token.                                    |
| `confidential-mpt` | devnet          | Creates or reuses a confidential MPT, registers the ElGamal keys, converts a holder balance to confidential, then optionally sends and converts back.            |
| `lending-setup`    | devnet          | Creates a transferable MPT, a closed-ended vault, a deposit, a loan broker and its first-loss cover. The loan itself is created afterwards with `sign-loan-set`. |

The input of each workflow is described in its schema, in `src/mastra/workflows/*.types.ts`.

## Add a tool

Transaction tools use the factory. It adds `network` and `seed`, refuses seeds outside test networks, hex-encodes every currency code, then autofills, signs and submits the transaction:

```typescript
// src/mastra/tools/transactions/payment/payment.ts
import { Payment } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplPaymentSchema } from './payment.types'

const { createTransactionTool } = useTransactionToolFactory({ inputSchema: xrplPaymentSchema })

export const submitPaymentTool = createTransactionTool<Payment>({
  toolId: 'submit-payment',
  description: 'Submit a Payment transaction to send XRP, tokens or MPTs. ...',
  // Optional: reshape the input into the transaction
  buildTransaction: payment => ({ ...payment, Amount: payment.DeliverMax ? undefined : payment.Amount }) as Payment,
  // Optional: throw to refuse the transaction before it is signed
  validateTransaction: params => {
    if (params.Amount === undefined && params.DeliverMax === undefined) {
      throw new Error('Provide Amount (API v1) or DeliverMax (API v2)')
    }
  },
})
```

Query tools use `defineMethodTool` (`src/mastra/tools/methods/shared/method-tool.ts`), with the method name and the request and result schemas.

Export the new tool from its folder's `index.ts`. `src/mastra/catalog.ts` picks up every tool exported from `src/mastra/tools`, so the agent and the MCP server both get it. To send a tool to the agent on every request instead of on demand, add it to `coreTools` in the same file.

## Development

```bash
npm test               # unit tests
npm run format         # prettier
npm run eval           # accuracy, cost and latency of the agent (see evals/README.md)
npm run build:mcp      # build the MCP package
```

Domain terms are in [CONTEXT.md](https://github.com/florent-uzio/xrpl-mastra-ai/blob/main/CONTEXT.md). Releases of the MCP package follow [RELEASING.md](https://github.com/florent-uzio/xrpl-mastra-ai/blob/main/RELEASING.md).
