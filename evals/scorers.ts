import { Agent } from '@mastra/core/agent'
import { z } from 'zod'

export type Question =
  | { id: string; category: string; question: string; scoring: 'contains'; expected: string[] }
  | { id: string; category: string; question: string; scoring: 'judge'; expected: string }
  | { id: string; category: string; question: string; scoring: 'tool'; expected: string[] }

export type Score = { score: 0 | 1; reason: string }

// Lowercase and drop thousands separators so "1,000,000" matches "1000000".
const normalize = (text: string) => text.toLowerCase().replace(/(\d),(\d)/g, '$1$2')

// Pass if the answer contains at least one of the accepted strings.
export const scoreContains = (answer: string, expected: string[]): Score => {
  const hit = expected.find(e => normalize(answer).includes(normalize(e)))
  return hit ? { score: 1, reason: `contains "${hit}"` } : { score: 0, reason: 'none of the expected strings found' }
}

// Pass if at least one of the accepted tools was called.
export const scoreTool = (toolsCalled: string[], expected: string[]): Score => {
  const hit = expected.find(t => toolsCalled.includes(t))
  return hit
    ? { score: 1, reason: `called ${hit}` }
    : { score: 0, reason: `none of the expected tools called (called: ${toolsCalled.join(', ') || 'none'})` }
}

// An LLM compares the answer to the reference answer and returns pass/fail.
export const scoreJudge = async (
  judgeModel: string,
  question: string,
  answer: string,
  expected: string,
): Promise<Score> => {
  const judge = new Agent({
    id: 'eval-judge',
    name: 'Eval judge',
    model: judgeModel,
    instructions: `You grade answers about the XRP Ledger. Compare the candidate answer to the reference answer.
Pass (score 1) if the candidate states the same key facts as the reference, even with different wording or extra detail.
Fail (score 0) if it misses a key fact or contradicts the reference.`,
  })
  const result = await judge.generate(
    `Question: ${question}\n\nReference answer: ${expected}\n\nCandidate answer: ${answer}`,
    { structuredOutput: { schema: z.object({ score: z.union([z.literal(0), z.literal(1)]), reason: z.string() }) } },
  )
  return result.object
}
