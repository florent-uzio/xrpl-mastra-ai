---
'@florent-uzio/xrpl-mcp': minor
---

The `submit-*` transaction tools take only `network`, `seed` and `txn`, and `seed` is now required. The `signature` input is gone: to submit a transaction signed elsewhere (for example on mainnet), pass the signed blob to `submit-signed-blob`.

Currency codes are hex-encoded wherever they appear in a transaction, at any depth. This fixes Payment `SendMax`, `DeliverMin` and `Paths`, and Clawback `Amount`, which were sent unencoded. OracleSet now also encodes `BaseAsset` and `QuoteAsset`.
