---
'@florent-uzio/xrpl-mcp': patch
---

Report transactions that fail on ledger. Every `submit-*` tool now returns `ok` and `engine_result` at the top level, so a `tec*` result (validated, fee charged, nothing done) can't be mistaken for success. The `iou-issuance` workflow now stops at the first failed transaction. It used to keep going and record the run as successful. A transaction that uses a Ticket now gets `Sequence: 0` in every tool, not only in `prepare-loan-set`.
