import { ECDSA, Wallet } from 'xrpl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getXrplClient } from '../../../helpers'
import * as tools from './index'

vi.mock('../../../helpers', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../helpers')>()),
  getXrplClient: vi.fn(),
}))

const NETWORK = 'wss://s.devnet.rippletest.net:51233/'
const holder = Wallet.generate(ECDSA.secp256k1).classicAddress
const issuer = Wallet.generate(ECDSA.secp256k1).classicAddress
const confidentialSeed = Wallet.generate(ECDSA.secp256k1).seed!
const mptIssuanceId = '00000001' + 'A'.repeat(40)

type ExecutableTool = { execute: (input: unknown, context: unknown) => Promise<unknown> }
const execute = (tool: unknown, input: object) =>
  (tool as ExecutableTool).execute({ network: NETWORK, mptIssuanceId, confidentialSeed, ...input }, {})

// The crypto layer and the ledger can throw plain objects, which used to show as [object Object]
const plainObjectError = { code: 42, reason: 'proof generation failed' }

beforeEach(() => {
  vi.mocked(getXrplClient).mockResolvedValue({
    getLedgerIndex: async () => 5,
    request: async () => {
      throw plainObjectError
    },
  } as never)
})

describe('confidential prepare tools', () => {
  it.each([
    ['prepareConfidentialConvertTool', { holder, amount: '10' }],
    ['prepareConfidentialClawbackTool', { issuer, holder }],
    [
      'prepareConfidentialBatchTool',
      {
        account: holder,
        inners: [
          { operation: 'convert', account: holder, mptIssuanceId, amount: '1', confidentialSeed },
          { operation: 'convert', account: holder, mptIssuanceId, amount: '1', confidentialSeed },
        ],
      },
    ],
  ])('%s throws a readable error', async (name, input) => {
    await expect(execute(tools[name as keyof typeof tools], input)).rejects.toThrow(
      '{"code":42,"reason":"proof generation failed"}',
    )
  })
})
