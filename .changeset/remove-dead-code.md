---
'@florent-uzio/xrpl-mcp': patch
---

Remove unused code: the flag-name helpers and enums of TrustSet, AccountSet, OfferCreate and NFTokenMint, and the commented-out validations in TrustSet, Clawback and NFTokenMint. The AccountSet `SetFlag` and `ClearFlag` descriptions now point to the asf* numbers in the tool description instead of an internal schema name.
