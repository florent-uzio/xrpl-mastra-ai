import { MCPClient } from '@mastra/mcp'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { XRPL_INSTRUCTIONS } from '../mastra/instructions'
import * as toolsBarrel from '../mastra/tools'

const SERVER = 'xrpl'

describe('xrpl MCP server', () => {
  let client: MCPClient
  let toolNames: string[]

  beforeAll(async () => {
    client = new MCPClient({
      servers: {
        [SERVER]: {
          command: 'npx',
          args: ['tsx', path.join(__dirname, 'stdio.ts')],
          env: { PATH: process.env.PATH ?? '' },
        },
      },
    })
    const tools = await client.listTools()
    toolNames = Object.keys(tools).map(name => name.slice(SERVER.length + 1))
  }, 60_000)

  afterAll(() => client.disconnect())

  it('lists every tool of the tools barrel', () => {
    const expected = Object.entries(toolsBarrel)
      .filter(([, value]) => typeof value === 'object' && value !== null && 'execute' in value)
      .map(([name]) => name)
    expect(expected.length).toBeGreaterThan(100)
    expect(toolNames).toEqual(expect.arrayContaining(expected))
  })

  it('lists the three workflows', () => {
    expect(toolNames).toEqual(expect.arrayContaining(['run_iou-issuance', 'run_mpt-issuance', 'run_confidential-mpt']))
  })

  it('lists no agent tool', () => {
    expect(toolNames.filter(name => name.startsWith('ask_'))).toEqual([])
  })

  it('returns the shared instructions', () => {
    const instructions = client.getServerInstructions()[SERVER]
    expect(instructions).toContain(XRPL_INSTRUCTIONS)
    expect(instructions).toContain('save-flow-record')
  })
})
