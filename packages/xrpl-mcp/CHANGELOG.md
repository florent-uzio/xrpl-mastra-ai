# @florent-uzio/xrpl-mcp

## 1.3.0

### Minor Changes

- 1fb0301: One network table, and seeds stay out of workflow results.

  - Every network list comes from one table: the seed guard, the networks each workflow accepts, and the network section of the instructions. The `iou-issuance` and `mpt-issuance` workflows now accept every testnet and devnet URL, including Clio and honeycluster. Every workflow accepts a URL with or without the trailing `/`.
  - Workflow results now hold addresses only, plus `recordId`. Seeds, private keys and confidential seeds are only in the flow record, which `get-flow-records` reads. Between steps, wallets are plain JSON, so a step that resumes from a snapshot works.
  - `save-flow-record` takes the network's WebSocket URL and refuses seeds and private keys unless that network is a test network. `get-flow-records` returns at most `limit` records (10 by default), skips corrupt files, and refuses flow names that would leave the records folder.

- 10a0cbc: List every tool and workflow once, in `src/mastra/catalog.ts`. The agent, the MCP server and the Mastra instance all read from it, so exporting a tool from `src/mastra/tools` is enough to expose it.

  - MCP tool names do not change.
  - Workflows now use one key everywhere (`iou-issuance`, `mpt-issuance`, `confidential-mpt`, `lending-setup`). In Mastra Studio and `mastra.getWorkflow()` they replace `iouIssuanceWorkflow` and the like, and the agent's workflow tools become `workflow-iou-issuance` and the like.

- 5560695: The `submit-*` transaction tools take only `network`, `seed` and `txn`, and `seed` is now required. The `signature` input is gone: to submit a transaction signed elsewhere (for example on mainnet), pass the signed blob to `submit-signed-blob`.

  Currency codes are hex-encoded wherever they appear in a transaction, at any depth. This fixes Payment `SendMax`, `DeliverMin` and `Paths`, and Clawback `Amount`, which were sent unencoded. OracleSet now also encodes `BaseAsset` and `QuoteAsset`.

### Patch Changes

- 7a64122: Report transactions that fail on ledger. Every `submit-*` tool now returns `ok` and `engine_result` at the top level, so a `tec*` result (validated, fee charged, nothing done) can't be mistaken for success. The `iou-issuance` workflow now stops at the first failed transaction. It used to keep going and record the run as successful. A transaction that uses a Ticket now gets `Sequence: 0` in every tool, not only in `prepare-loan-set`.
- aa90388: Build every query tool with one `defineMethodTool` builder. Tool names, inputs and outputs do not change.

  - `get-ledger-entry` now hex-encodes the currency of a `ripple_state` selector, so `{ ripple_state: { accounts, currency: "RLUSD" } }` finds the trust line instead of failing. Every query tool now encodes currency codes the same way the transaction tools do.

- 2b9dcf2: Fix three tool bugs:

  - `submit-account-set` can now clear the domain with `Domain: ""`. An empty string used to be dropped, so the domain could not be cleared.
  - `get-ripple-path-find` accepts `value: "-1"` in `destination_amount`, as its description says, to find the largest amount that can be delivered.
  - `submit-trustset` and `submit-offer-create` now list the numeric value of each flag, so the model no longer has to guess the number to pass in `Flags`.

- b9a4791: Rewrite the README: shorter, with the current tools, model, environment variables and workflows.
- 1d357f6: Fix the remaining tool bugs:

  - `submit-clawback` can claw back an MPT: `Amount` accepts `{ mpt_issuance_id, value }`, with the holder in `Holder` (required for an MPT, refused for a trust line token).
  - `submit-oracle-set` reads `AssetPrice` as a decimal integer (a number, or a string above 2^53) and converts it to hex. A string used to be read as hex, so `"740"` meant 1856. Hex input is now refused.
  - The confidential `prepare-*` tools throw a readable error instead of `[object Object]`. `prepare-confidential-batch` throws like the others instead of returning `{ error }`. The confidential workflow shows those errors instead of "Unknown error".
  - Currency codes over 20 bytes are refused instead of producing an invalid code, and a 40-character code passes through only if it is hex.

- 75552c6: Remove unused code: the flag-name helpers and enums of TrustSet, AccountSet, OfferCreate and NFTokenMint, and the commented-out validations in TrustSet, Clawback and NFTokenMint. The AccountSet `SetFlag` and `ClearFlag` descriptions now point to the asf* numbers in the tool description instead of an internal schema name.

## 1.2.1

### Patch Changes

- dc7e950: Fix the confidential MPT tools in the bundled server: define `__dirname` and ship `mpt_crypto.wasm` next to the bundle. Both were missing, so ConfidentialMPTConvert and the other confidential tools failed with `__dirname is not defined`.

## 1.2.0

### Minor Changes

- 81b0f5e: Add a `lending-setup` workflow that sets up the Lending Protocol on devnet: a new or existing MPT, a closed-ended vault with a deposit, and a loan broker with its first-loss cover, ready for a loan. The agent now states the loan terms and due dates and waits for confirmation before a LoanSet.
- 00195e6: Update xrpl.js to 5.4.0-beta.0. The `confidential-mpt` workflow can now create the MPT with XLS-89 metadata (`issuance.metadata`).

## 1.1.0

### Minor Changes

- 71f1984: Add a `prepare-loan-set` tool that returns an unsigned LoanSet with a longer expiry, so the broker owner and the borrower can sign it on their own machines and create a loan on mainnet.
- b460d24: Add a `sign-loan-set` tool that signs a LoanSet as both parties on testnet/devnet, so a loan can be created end to end with `submit-signed-blob`.

## 1.0.2

### Patch Changes

- 5d45b5a: Add a `getMcpVersionTool` tool so Claude can report which version of the MCP server is running.

## 1.0.1

### Patch Changes

- cc6e73e: Ship the MCP server as a single bundled file with no npm dependencies, so installing it no longer pulls in the Mastra and xrpl.js dependency trees. Third-party license notices are in `THIRD_PARTY_LICENSES.txt`.
