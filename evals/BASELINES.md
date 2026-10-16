# Eval results

Key numbers from eval runs worth keeping. Raw run files in `evals/results/` are git-ignored.

## 2026-10-16 — baseline, no RAG (20 questions × 3 runs)

Judge: `anthropic/claude-sonnet-5-5`.

| Model                         | Accuracy | Per run       | Avg latency | Cost per run |
| ----------------------------- | -------- | ------------- | ----------- | ------------ |
| `anthropic/claude-sonnet-5-5` | 95%      | 95 / 95 / 95% | 7.4 s       | $0.29        |
| `openai/gpt-5.4-mini`         | 58%      | 55 / 60 / 60% | 3.7 s       | $0.07        |

By category:

| Category          | Claude Sonnet 5.5 | GPT-5.4 mini |
| ----------------- | ----------------- | ------------ |
| accounts (5)      | 100%              | 80%          |
| tokens (5)        | 80%               | 40%          |
| transactions (4)  | 100%              | 42%          |
| public-api (3)    | 100%              | 33%          |
| ledger-lookup (3) | 100%              | 100%         |

Notes:

- GPT-5.4 mini fails all 3 runs on the newer features (MPT holders, Batch flags, confidential MPTs, lending, `vault_info`) and on `blackholed-accounts` (one `r` too many in ACCOUNT_ONE).
- Both models fail `token-types`: they read it as "how many tokens exist" rather than "how many kinds of token".
- The judge is Claude, so Claude is grading its own answers. Not yet cross-checked with another judge.

## 2026-10-16 — tool schema and outputSchema changes (PR #10) (20 questions × 3 runs)

Judge: `anthropic/claude-sonnet-5-5`. Same questions and settings as the baseline above, agent model `anthropic/claude-sonnet-5-5`.

| Version      | Accuracy | Per run       | Avg latency | Cost per run |
| ------------ | -------- | ------------- | ----------- | ------------ |
| Baseline     | 95%      | 95 / 95 / 95% | 7.4 s       | $0.29        |
| After PR #10 | 95%      | 95 / 95 / 95% | 7.0 s       | $0.25        |

By category: accounts, ledger-lookup, public-api and transactions 100%; tokens 80%. Same as the baseline.

Notes:

- No regression. `token-types` still fails (same cause as the baseline).
- The cost and latency drop (about 13% and 5%) is within normal variation for 3 runs; it fits the shorter tool schemas but is not confirmed.
- The evals don't submit transactions, so the transaction tools were not exercised.

## 2026-10-16 — dynamic tool loading with `ToolSearchProcessor` (20 questions × 1 run)

Judge: `anthropic/claude-sonnet-5-5`. Agent model `anthropic/claude-sonnet-5-5`. 9 core tools are always sent; the other 42 (including every `submit*` tool) are loaded on demand via `search_tools` / `load_tool`. Instructions were also trimmed.

| Version              | Accuracy | Avg latency | Cost per run |
| -------------------- | -------- | ----------- | ------------ |
| After PR #10         | 95%      | 7.0 s       | $0.25        |
| Dynamic tool loading | 100%     | 6.3 s       | $0.20        |

Notes:

- Single run, so the accuracy difference is within noise; the cost drop (about 21%) is the signal.
- The evals only call core tools. Loading was checked by hand: `gateway_balances` and `submit-amm-create` were both found and loaded without a prompt hint.
- Loading costs extra model turns (`search_tools`, `load_tool`) the first time a non-core tool is needed.
