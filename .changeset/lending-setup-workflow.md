---
'@florent-uzio/xrpl-mcp': minor
---

Add a `lending-setup` workflow that sets up the Lending Protocol on devnet: a new or existing MPT, a closed-ended vault with a deposit, and a loan broker with its first-loss cover, ready for a loan. The agent now states the loan terms and due dates and waits for confirmation before a LoanSet.
