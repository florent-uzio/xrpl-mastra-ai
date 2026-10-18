import { Mastra } from '@mastra/core/mastra'
import { LibSQLStore } from '@mastra/libsql'
import { PinoLogger } from '@mastra/loggers'
import { getStorageUrl } from '../helpers'
import { xrplAgent } from './agents/xrpl-agent'
import { containsScorer, createJudgeScorer, toolScorer } from './scorers'
import { confidentialMptWorkflow, iouIssuanceWorkflow, mptIssuanceWorkflow } from './workflows'

export const mastra = new Mastra({
  workflows: { confidentialMptWorkflow, iouIssuanceWorkflow, mptIssuanceWorkflow },
  agents: { xrplAgent },
  // Listed in Studio. `npm run eval` registers the judge again with the model from --judge.
  scorers: { contains: containsScorer, tool: toolScorer, judge: createJudgeScorer() },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    // stores telemetry, evals, ... in <project root>/mastra.db, shared by Studio and `npm run eval`
    url: getStorageUrl(),
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
})
