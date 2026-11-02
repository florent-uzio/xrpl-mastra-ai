---
'@florent-uzio/xrpl-mcp': patch
---

Fix three tool bugs:

- `submit-account-set` can now clear the domain with `Domain: ""`. An empty string used to be dropped, so the domain could not be cleared.
- `get-ripple-path-find` accepts `value: "-1"` in `destination_amount`, as its description says, to find the largest amount that can be delivered.
- `submit-trustset` and `submit-offer-create` now list the numeric value of each flag, so the model no longer has to guess the number to pass in `Flags`.
