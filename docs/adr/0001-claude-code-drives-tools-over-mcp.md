# Claude Code drives the XRPL tools over MCP; the Mastra agent is for evals and the demo only

Day-to-day XRPL work runs in Claude Code on the Ripple Enterprise subscription, which calls this repo's tools and workflows through a local stdio MCP server, so no personal Anthropic/OpenAI key pays for it. The Mastra agent stays, but only as the eval and demo target (paid with a personal key). Colleagues get the same setup through a Claude Code plugin that starts the npm-published server on their own machine, test networks only.

## Considered Options

- **Expose the Mastra agent as one MCP tool**: rejected, every call would still go through the agent's model on a personal key.
- **Mastra supervisor + subagents**: rejected for daily use, every Mastra agent calls a model with an API key. Claude Code subagents fill that role when custody.js arrives.
- **Convert the tools to skills (scripts run through Bash)**: rejected, a second codebase next to the one the evals measure, no schema validation, seeds passed as shell arguments, no reused XRPL connections. Skills may still carry know-how the server can't.
- **Host the agent or the MCP server on Mastra Cloud for colleagues**: rejected for now, the agent would need someone's model key on the server, and a shared server would mix every colleague's flow records (with seeds) and need authentication.

## Consequences

- The agent's rules (networks, seed policy, drops→XRP) must reach Claude through the MCP server's instructions, from one source shared with the agent.
- The test-network-only seed rule must be enforced in code, not just in instructions, since any MCP client can call the tools.
- Ledger facts are remembered in flow records, not Mastra working memory, which Claude Code can't reach.
