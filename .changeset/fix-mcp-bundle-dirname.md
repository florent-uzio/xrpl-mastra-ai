---
'@florent-uzio/xrpl-mcp': patch
---

Fix the confidential MPT tools in the bundled server: define `__dirname` and ship `mpt_crypto.wasm` next to the bundle. Both were missing, so ConfidentialMPTConvert and the other confidential tools failed with `__dirname is not defined`.
