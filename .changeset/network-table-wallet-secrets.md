---
'@florent-uzio/xrpl-mcp': minor
---

One network table, and seeds stay out of workflow results.

- Every network list comes from one table: the seed guard, the networks each workflow accepts, and the network section of the instructions. The `iou-issuance` and `mpt-issuance` workflows now accept every testnet and devnet URL, including Clio and honeycluster. Every workflow accepts a URL with or without the trailing `/`.
- Workflow results now hold addresses only, plus `recordId`. Seeds, private keys and confidential seeds are only in the flow record, which `get-flow-records` reads. Between steps, wallets are plain JSON, so a step that resumes from a snapshot works.
- `save-flow-record` takes the network's WebSocket URL and refuses seeds and private keys unless that network is a test network. `get-flow-records` returns at most `limit` records (10 by default), skips corrupt files, and refuses flow names that would leave the records folder.
