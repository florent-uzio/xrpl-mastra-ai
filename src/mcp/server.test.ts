import { MCPClient } from '@mastra/mcp'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { XRPL_INSTRUCTIONS } from '../mastra/instructions'
import * as toolsBarrel from '../mastra/tools'

const SERVER = 'xrpl'

const callPayment = async (mcp: MCPClient, input: object) => {
  const tools = await mcp.listTools()
  try {
    return await tools[`${SERVER}_submitPaymentTool`].execute?.(input, {} as never)
  } catch (error) {
    return { error: String(error) }
  }
}

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

  describe('seed policy', () => {
    const payment = (network: string) => ({
      network,
      seed: 'sEdTM1uX8pu2do5XvTnutH6HsouMaM2',
      txn: {
        TransactionType: 'Payment',
        Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        Destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
        Amount: '1',
      },
    })

    it('refuses a seed on mainnet without connecting', async () => {
      const result = await callPayment(client, payment('wss://xrplcluster.com/'))
      expect(JSON.stringify(result)).toMatch(/Wallet seeds are refused on wss:\/\/xrplcluster\.com\//)
    })

    it('lets a seed through the check on a test network', async () => {
      // The unreachable URL is allowed through the env var: the call gets past the check and fails to connect.
      const other = new MCPClient({
        servers: {
          [SERVER]: {
            command: 'npx',
            args: ['tsx', path.join(__dirname, 'stdio.ts')],
            env: { PATH: process.env.PATH ?? '', XRPL_EXTRA_TEST_NETWORKS: 'ws://127.0.0.1:1' },
          },
        },
      })
      try {
        const result = await callPayment(other, payment('ws://127.0.0.1:1'))
        expect(JSON.stringify(result)).not.toMatch(/Wallet seeds are refused/)
      } finally {
        await other.disconnect()
      }
    }, 60_000)
  })
})
