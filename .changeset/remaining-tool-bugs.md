---
'@florent-uzio/xrpl-mcp': patch
---

Fix the remaining tool bugs:

- `submit-clawback` can claw back an MPT: `Amount` accepts `{ mpt_issuance_id, value }`, with the holder in `Holder` (required for an MPT, refused for a trust line token).
- `submit-oracle-set` reads `AssetPrice` as a decimal integer (a number, or a string above 2^53) and converts it to hex. A string used to be read as hex, so `"740"` meant 1856. Hex input is now refused.
- The confidential `prepare-*` tools throw a readable error instead of `[object Object]`. `prepare-confidential-batch` throws like the others instead of returning `{ error }`. The confidential workflow shows those errors instead of "Unknown error".
- Currency codes over 20 bytes are refused instead of producing an invalid code, and a 40-character code passes through only if it is hex.
