# Evals

A fixed set of XRPL questions with expected answers. Running it gives an accuracy, cost and latency number per model, so every change (RAG, prompts, model) can be compared to a baseline.

## Run

```sh
npm run eval                                        # default agent model (openai/gpt-5.4-mini)
npm run eval -- --model anthropic/claude-sonnet-5-5
npm run eval -- --model groq/openai/gpt-oss-120b
npm run eval -- --judge openai/gpt-5.4-mini          # change the judge model (default: Claude)
```

Model ids use Mastra's model router format (`provider/model`). API keys come from `.env`. Each run writes a JSON file to `evals/results/`.

## Writing questions

Add entries to `questions.json`. Each question picks one `scoring` type:

| scoring | expected | passes when |
|---|---|---|
| `contains` | list of strings | the answer contains at least one of them (case-insensitive, `1,000` = `1000`) |
| `judge` | reference answer | an LLM judge says the answer states the same key facts |
| `tool` | list of tool names (keys in the agent's `tools`, e.g. `getAccountInfoTool`) | the agent called all of them |

Use `contains` for short facts, `judge` for explanations, `tool` for questions that need live ledger data (the value changes, so only the tool call is checked). Don't write questions that make the agent submit a transaction.
