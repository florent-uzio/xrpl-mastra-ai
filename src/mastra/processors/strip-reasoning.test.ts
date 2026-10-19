import { describe, expect, it } from 'vitest'
import { stripReasoningProcessor } from './strip-reasoning'

const run = (prompt: unknown[]) => stripReasoningProcessor.processLLMRequest({ prompt } as never)

describe('stripReasoningProcessor', () => {
  it('drops reasoning parts and keeps everything else', async () => {
    const result = await run([
      { role: 'user', content: [{ type: 'text', text: 'hi' }] },
      {
        role: 'assistant',
        content: [
          { type: 'reasoning', text: '', providerOptions: { anthropic: { signature: 'sig' } } },
          { type: 'text', text: 'hello' },
        ],
      },
    ])
    expect(result?.prompt).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'hi' }] },
      { role: 'assistant', content: [{ type: 'text', text: 'hello' }] },
    ])
  })

  it('removes assistant messages left empty', async () => {
    const result = await run([{ role: 'assistant', content: [{ type: 'reasoning', text: 'x' }] }])
    expect(result?.prompt).toEqual([])
  })
})
