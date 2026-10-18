import { describe, expect, it } from 'vitest'
import { containsScorer, scoreQuestion, toolScorer, type Question } from './scorers'

const message = (parts: any[]) => ({
  id: 'm1',
  role: 'assistant' as const,
  createdAt: new Date(),
  content: { format: 2 as const, parts },
})
const text = (value: string) => message([{ type: 'text', text: value }])
const toolCall = (toolName: string) =>
  message([
    { type: 'tool-invocation', toolInvocation: { state: 'result', toolCallId: 'c1', toolName, args: {}, result: {} } },
  ])

const contains: Question = {
  id: 'drops',
  category: 'tokens',
  question: 'How many drops are in one XRP?',
  scoring: 'contains',
  expected: ['1000000', 'one million'],
}
const tool: Question = {
  id: 'balance',
  category: 'ledger-lookup',
  question: 'Balance?',
  scoring: 'tool',
  expected: ['getAccountInfoTool', 'getAccountTool'],
}

describe('eval scorers', () => {
  it('contains passes on any accepted string, ignoring case and thousands separators', async () => {
    const pass = await scoreQuestion('unused', contains, { input: {}, output: [text('There are 1,000,000 drops.')] })
    expect(pass.score).toBe(1)
    const alt = await scoreQuestion('unused', contains, { input: {}, output: [text('One Million drops.')] })
    expect(alt.score).toBe(1)
  })

  it('contains fails when no accepted string is present', async () => {
    const fail = await scoreQuestion('unused', contains, { input: {}, output: [text('A lot of drops.')] })
    expect(fail).toEqual({ score: 0, reason: 'none of the expected strings found' })
  })

  it('tool passes when an accepted tool was called and fails otherwise', async () => {
    const pass = await scoreQuestion('unused', tool, {
      input: {},
      output: [toolCall('getAccountInfoTool'), text('ok')],
    })
    expect(pass).toEqual({ score: 1, reason: 'called getAccountInfoTool' })
    const fail = await scoreQuestion('unused', tool, { input: {}, output: [toolCall('otherTool')] })
    expect(fail.score).toBe(0)
    expect(fail.reason).toContain('called: otherTool')
  })

  it('a scorer skips questions of another scoring type', async () => {
    const run = { output: [text('1000000')], groundTruth: contains }
    expect((await toolScorer.run(run)).notScorable).toBeDefined()
    expect((await containsScorer.run(run)).notScorable).toBeUndefined()
  })
})
