import { RequestContext } from '@mastra/core/request-context'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { DEFAULT_MODEL, xrplAgent } from '../src/mastra/agents/xrpl-agent'
import { Question, Score, scoreContains, scoreJudge, scoreTool } from './scorers'

const { values } = parseArgs({
  options: {
    model: { type: 'string', default: DEFAULT_MODEL as string },
    judge: { type: 'string', default: 'anthropic/claude-sonnet-5-5' },
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

const results: Record<string, any>[] = []
for (let run = 1; run <= runs; run++) {
  for (const q of questions) {
    const requestContext = new RequestContext()
    requestContext.set('model', model)
    const start = Date.now()
    try {
      const result = await xrplAgent.generate(q.question, { requestContext })
      const latencyMs = Date.now() - start
      const toolsCalled = result.steps.flatMap(step => step.toolCalls.map(call => call.payload.toolName))
      const {
        inputTokens = 0,
        outputTokens = 0,
        cachedInputTokens = 0,
        cacheCreationInputTokens = 0,
      } = result.totalUsage
      // inputTokens includes cached reads and cache writes, which are billed at their own prices.
      const uncachedInputTokens = inputTokens - cachedInputTokens - cacheCreationInputTokens
      const costUsd = price
        ? (uncachedInputTokens * price.input +
            cachedInputTokens * price.cacheRead +
            cacheCreationInputTokens * price.cacheWrite +
            outputTokens * price.output) /
          1e6
        : null

      let score: Score
      if (q.scoring === 'contains') score = scoreContains(result.text, q.expected)
      else if (q.scoring === 'tool') score = scoreTool(toolsCalled, q.expected)
      else score = await scoreJudge(judgeModel, q.question, result.text, q.expected)

      results.push({
        run,
        ...q,
        answer: result.text,
        toolsCalled,
        ...score,
        latencyMs,
        inputTokens,
        cachedInputTokens,
        cacheCreationInputTokens,
        outputTokens,
        costUsd,
      })
      console.log(`[run ${run}] ${score.score ? 'PASS' : 'FAIL'}  ${q.id}  (${score.reason})`)
    } catch (error) {
      results.push({ run, ...q, score: 0, reason: `error: ${String(error)}`, latencyMs: Date.now() - start })
      console.log(`[run ${run}] ERROR ${q.id}  ${String(error)}`)
    }
  }
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
