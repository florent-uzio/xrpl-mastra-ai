import { Mastra } from '@mastra/core/mastra'
import { LibSQLStore } from '@mastra/libsql'
import { PinoLogger } from '@mastra/loggers'
import { xrplAgent } from './agents/xrpl-agent'
import { confidentialMptWorkflow, iouIssuanceWorkflow, mptIssuanceWorkflow } from './workflows'

export const mastra = new Mastra({
  workflows: { confidentialMptWorkflow, iouIssuanceWorkflow, mptIssuanceWorkflow },
  agents: { xrplAgent },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    // stores telemetry, evals, ... in memory by default. Set MASTRA_STORAGE_URL (e.g. file:/abs/path/mastra.db) to persist
    // them, so Studio and `npm run eval` share the same datasets, experiments and scores.
    url: process.env.MASTRA_STORAGE_URL ?? ':memory:',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
})
