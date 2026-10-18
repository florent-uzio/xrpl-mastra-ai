import { runEvals } from '@mastra/core/evals'
import { RequestContext } from '@mastra/core/request-context'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { mastra } from '../src/mastra'
import { DEFAULT_MODEL } from '../src/mastra/agents/xrpl-agent'
import { containsScorer, createJudgeScorer, DEFAULT_JUDGE_MODEL, Question, toolScorer } from '../src/mastra/scorers'

const { values } = parseArgs({
  options: {
    model: { type: 'string', default: DEFAULT_MODEL as string },
    judge: { type: 'string', default: DEFAULT_JUDGE_MODEL },
    // Answers and judge verdicts vary between runs, so average several runs before comparing models.
    runs: { type: 'string', default: '1' },
  },
})
const model = values.model!
const judgeModel = values.judge!
const runs = Number(values.runs)

// List prices in USD per million tokens, from models.dev (the registry Mastra's model router uses).
const getPrice = async (modelId: string) => {
  const [provider, ...rest] = modelId.split('/')
  const registry = await fetch('https://models.dev/api.json').then(r => r.json())
  const cost = registry[provider]?.models?.[rest.join('/')]?.cost
  if (!cost) {
    console.warn(`No price found for ${modelId}; cost will be reported as null.`)
    return null
  }
  // Providers without a separate cache price bill cached tokens at the normal input price.
  return {
    input: cost.input as number,
    output: cost.output as number,
    cacheRead: (cost.cache_read ?? cost.input) as number,
    cacheWrite: (cost.cache_write ?? cost.input) as number,
  }
}

const questions: Question[] = JSON.parse(await readFile(new URL('./questions.json', import.meta.url), 'utf8'))
const price = await getPrice(model)

const agent = mastra.getAgent('xrplAgent')
const scorers = [containsScorer, toolScorer, createJudgeScorer(judgeModel)]
// runEvals saves scores to storage, which only works for scorers registered on the Mastra instance.
for (const scorer of scorers) mastra.addScorer(scorer)

const results: Record<string, any>[] = []
for (let run = 1; run <= runs; run++) {
  // Questions run one at a time, so the agent call of an item starts when the previous item finished
  // and ends at onFinish. Latency leaves out the scoring time (the judge call).
  let itemStart = Date.now()
  let agentEnd = itemStart
  await runEvals({
    data: questions.map(q => {
      const requestContext = new RequestContext()
      requestContext.set('model', model)
      return { input: q.question, groundTruth: q, requestContext }
    }),
    target: agent,
    scorers,
    targetOptions: { onFinish: () => void (agentEnd = Date.now()) },
    onItemComplete: ({ item, targetResult, scorerResults }) => {
      const q = item.groundTruth as Question
      const latencyMs = agentEnd - itemStart
      const toolsCalled = targetResult.steps.flatMap(step => step.toolCalls.map(call => call.payload.toolName))
      const {
        inputTokens = 0,
        outputTokens = 0,
        cachedInputTokens = 0,
        cacheCreationInputTokens = 0,
      } = targetResult.totalUsage
      // inputTokens includes cached reads and cache writes, which are billed at their own prices.
      const uncachedInputTokens = inputTokens - cachedInputTokens - cacheCreationInputTokens
      const costUsd = price
        ? (uncachedInputTokens * price.input +
            cachedInputTokens * price.cacheRead +
            cacheCreationInputTokens * price.cacheWrite +
            outputTokens * price.output) /
          1e6
        : null

      // Every scorer but the one matching the question's scoring type returns notScorable.
      const scored = Object.values<any>(scorerResults).find(result => !result.notScorable)
      const score = scored?.score ?? 0
      const reason = scored ? String(scored.reason) : 'no scorer produced a score'

      results.push({
        run,
        ...q,
        answer: targetResult.text,
        toolsCalled,
        score,
        reason,
        latencyMs,
        inputTokens,
        cachedInputTokens,
        cacheCreationInputTokens,
        outputTokens,
        costUsd,
      })
      console.log(`[run ${run}] ${score ? 'PASS' : 'FAIL'}  ${q.id}  (${reason})`)
      itemStart = Date.now()
    },
  })
}

const sum = (rows: Record<string, any>[], key: 'score' | 'latencyMs' | 'costUsd') =>
  rows.reduce((total, r) => total + (r[key] ?? 0), 0)
const accuracy = (rows: Record<string, any>[]) => sum(rows, 'score') / rows.length
const categories = [...new Set(questions.map(q => q.category))]
const summary = {
  model,
  judgeModel,
  date: new Date().toISOString(),
  questions: questions.length,
  runs,
  accuracy: accuracy(results),
  accuracyPerRun: Array.from({ length: runs }, (_, i) => accuracy(results.filter(r => r.run === i + 1))),
  accuracyByCategory: Object.fromEntries(categories.map(c => [c, accuracy(results.filter(r => r.category === c))])),
  avgLatencyMs: Math.round(sum(results, 'latencyMs') / results.length),
  costPerRunUsd: price ? sum(results, 'costUsd') / runs : null,
}
console.log(JSON.stringify(summary, null, 2))

await mkdir(new URL('./results/', import.meta.url), { recursive: true })
const file = `./results/${summary.date.replace(/[:.]/g, '-')}_${model.replace(/\//g, '_')}.json`
await writeFile(new URL(file, import.meta.url), JSON.stringify({ summary, results }, null, 2))
console.log(`Saved evals/${file.slice(2)}`)
process.exit(0)
