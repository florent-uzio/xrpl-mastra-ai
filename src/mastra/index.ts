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
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ':memory:',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
})
