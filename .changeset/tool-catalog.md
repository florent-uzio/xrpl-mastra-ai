---
'@florent-uzio/xrpl-mcp': minor
---

List every tool and workflow once, in `src/mastra/catalog.ts`. The agent, the MCP server and the Mastra instance all read from it, so exporting a tool from `src/mastra/tools` is enough to expose it.

- MCP tool names do not change.
- Workflows now use one key everywhere (`iou-issuance`, `mpt-issuance`, `confidential-mpt`, `lending-setup`). In Mastra Studio and `mastra.getWorkflow()` they replace `iouIssuanceWorkflow` and the like, and the agent's workflow tools become `workflow-iou-issuance` and the like.
