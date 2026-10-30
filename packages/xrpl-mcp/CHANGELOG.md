# @florent-uzio/xrpl-mcp

## 1.2.0

### Minor Changes

- 81b0f5e: Add a `lending-setup` workflow that sets up the Lending Protocol on devnet: a new or existing MPT, a closed-ended vault with a deposit, and a loan broker with its first-loss cover, ready for a loan. The agent now states the loan terms and due dates and waits for confirmation before a LoanSet.

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
