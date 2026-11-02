---
'@florent-uzio/xrpl-mcp': patch
---

Build every query tool with one `defineMethodTool` builder. Tool names, inputs and outputs do not change.

- `get-ledger-entry` now hex-encodes the currency of a `ripple_state` selector, so `{ ripple_state: { accounts, currency: "RLUSD" } }` finds the trust line instead of failing. Every query tool now encodes currency codes the same way the transaction tools do.
