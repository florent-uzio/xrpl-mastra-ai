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
