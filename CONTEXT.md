# XRPL Mastra AI

An agent, tools and workflows that let a language model query and transact on the XRP Ledger, also served as an MCP server.

## Language

**Ledger submission**:
Sending a transaction to an XRPL network and waiting for its final, validated result. Every transaction the tools and workflows send goes through it.
_Avoid_: send, broadcast, submitTransaction

**tec result**:
A `tec*` result code: the transaction was included in a validated ledger but did not do what it asked, and the fee was still charged. It is final, so it is reported as a failure and never retried.
_Avoid_: soft failure, partial success

**Signed blob**:
A transaction already signed outside this server, as hex, ready to submit as is. The only way to submit on mainnet.
_Avoid_: signature (a signed blob holds the signature, plus every transaction field)

**Test network**:
An XRPL network where wallet seeds may be used: a known testnet, devnet or Xahau testnet URL, or one listed by the operator. Anything else is treated as mainnet.
_Avoid_: sandbox, non-mainnet

**Flow record**:
A saved summary of what a workflow run or a manual session created on a network: addresses, token and ledger entry IDs, transaction hashes, and on a test network the seeds needed to use the wallets again. Workflow results point to their flow record instead of carrying seeds.
_Avoid_: run log, wallet store
