import { createScorer, notScorable } from '@mastra/core/evals'
import type { ScorerRunOutputForAgent } from '@mastra/core/evals'
import { z } from 'zod'

export type Question =
  | { id: string; category: string; question: string; scoring: 'contains'; expected: string[] }
  | { id: string; category: string; question: string; scoring: 'judge'; expected: string }
  | { id: string; category: string; question: string; scoring: 'tool'; expected: string[] }

// Lowercase and drop thousands separators so "1,000,000" matches "1000000".
const normalize = (text: string) => text.toLowerCase().replace(/(\d),(\d)/g, '$1$2')

const getText = (output: ScorerRunOutputForAgent) =>
  output
    .filter(message => message.role === 'assistant')
    .flatMap(message => message.content.parts.flatMap(part => (part.type === 'text' ? [part.text] : [])))
    .join('\n')

const getToolsCalled = (output: ScorerRunOutputForAgent) =>
  output.flatMap(message =>
    message.content.parts.flatMap(part => (part.type === 'tool-invocation' ? [part.toolInvocation.toolName] : [])),
  )

// Each question carries its own scoring type in `groundTruth`, so a scorer skips questions meant for another one.
const questionFor = <T extends Question['scoring']>(groundTruth: unknown, scoring: T) => {
  const question = groundTruth as Question | undefined
  return question?.scoring === scoring ? (question as Extract<Question, { scoring: T }>) : undefined
}

// Pass if the answer contains at least one of the accepted strings.
export const containsScorer = createScorer({
  id: 'contains',
  description: 'Passes when the answer contains at least one accepted string',
  type: 'agent',
})
  .preprocess(({ run }) => {
    const question = questionFor(run.groundTruth, 'contains')
    if (!question) return notScorable('not a contains question')
    const answer = normalize(getText(run.output))
    return { hit: question.expected.find(e => answer.includes(normalize(e))) }
  })
  .generateScore(({ results }) => (results.preprocessStepResult.hit ? 1 : 0))
  .generateReason(({ results }) => {
    const { hit } = results.preprocessStepResult
    return hit ? `contains "${hit}"` : 'none of the expected strings found'
  })

// Pass if at least one of the accepted tools was called.
export const toolScorer = createScorer({
  id: 'tool',
  description: 'Passes when the agent called at least one accepted tool',
  type: 'agent',
})
  .preprocess(({ run }) => {
    const question = questionFor(run.groundTruth, 'tool')
    if (!question) return notScorable('not a tool question')
    const toolsCalled = getToolsCalled(run.output)
    return { toolsCalled, hit: question.expected.find(t => toolsCalled.includes(t)) }
  })
  .generateScore(({ results }) => (results.preprocessStepResult.hit ? 1 : 0))
  .generateReason(({ results }) => {
    const { hit, toolsCalled } = results.preprocessStepResult
    return hit ? `called ${hit}` : `none of the expected tools called (called: ${toolsCalled.join(', ') || 'none'})`
  })

// An LLM compares the answer to the reference answer and returns pass/fail.
export const createJudgeScorer = (judgeModel: string) =>
  createScorer({
    id: 'judge',
    description: 'An LLM judge passes the answer when it states the same key facts as the reference',
    type: 'agent',
    judge: {
      model: judgeModel,
      instructions: `You grade answers about the XRP Ledger. Compare the candidate answer to the reference answer.
Pass (score 1) if the candidate states the same key facts as the reference, even with different wording or extra detail.
Fail (score 0) if it misses a key fact or contradicts the reference.`,
    },
  })
    .preprocess(({ run }) => {
      const question = questionFor(run.groundTruth, 'judge')
      if (!question) return notScorable('not a judge question')
      return { question: question.question, expected: question.expected, answer: getText(run.output) }
    })
    .analyze({
      description: 'Grade the candidate answer against the reference answer',
      outputSchema: z.object({ score: z.union([z.literal(0), z.literal(1)]), reason: z.string() }),
      createPrompt: ({ results }) => {
        const { question, expected, answer } = results.preprocessStepResult
        return `Question: ${question}\n\nReference answer: ${expected}\n\nCandidate answer: ${answer}`
      },
    })
    .generateScore(({ results }) => results.analyzeStepResult.score)
    .generateReason(({ results }) => results.analyzeStepResult.reason)
