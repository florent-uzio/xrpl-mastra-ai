# XRPL Mastra AI

Tools, workflows and an agent for querying the XRP Ledger and submitting transactions to it, driven by an LLM.

## Language

**Wallet**:
An XRPL key pair: a seed and the address derived from it.
_Avoid_: Account (an account is the ledger entry a wallet controls), key, custody account

**Network**:
The XRPL ledger instance a wallet or transaction belongs to: mainnet, testnet, devnet or Xahau testnet.
_Avoid_: Chain, environment

**Test network**:
Any network other than mainnet. Wallet seeds may be stored only for wallets on a test network.
_Avoid_: Sandbox

**Flow**:
A named sequence of ledger actions done for one purpose, e.g. "mpt-issuance" or "manual-nft-test", run by a workflow or done by hand.

**Flow record**:
A saved snapshot of what one run of a flow produced (wallets with seeds, token IDs, transaction hashes) so it can be reused later. Test networks only.
_Avoid_: Saved workflow, session, log
