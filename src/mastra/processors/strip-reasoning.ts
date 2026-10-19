import { BaseProcessor, type ProcessLLMRequestArgs, type ProcessLLMRequestResult } from '@mastra/core/processors'

// Anthropic binds each signed thinking block to the exact tools list of the request that produced it.
// ToolSearchProcessor changes that list as tools get loaded, so replaying the blocks is rejected with
// "Invalid `signature` in `thinking` block". Drop them from the outbound prompt (history stays intact).
class StripReasoningProcessor extends BaseProcessor<'strip-reasoning'> {
  readonly id = 'strip-reasoning'

  processLLMRequest({ prompt }: ProcessLLMRequestArgs): ProcessLLMRequestResult {
    return {
      prompt: prompt
        .map(message =>
          message.role === 'assistant'
            ? { ...message, content: message.content.filter(part => part.type !== 'reasoning') }
            : message,
        )
        .filter(message => message.role !== 'assistant' || message.content.length > 0),
    }
  }
}

export const stripReasoningProcessor = new StripReasoningProcessor()
