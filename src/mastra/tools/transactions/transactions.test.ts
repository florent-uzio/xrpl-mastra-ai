import { OfferCreateFlags, TrustSetFlags } from 'xrpl'
import { describe, expect, it } from 'vitest'
import * as tools from '../index'

const submitTools = Object.entries(tools).filter(([name]) => /^submit.+Tool$/.test(name)) as unknown as [
  string,
  { id: string; inputSchema: { safeParse: (input: unknown) => { success: boolean } } },
][]

const account = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const base = { network: 'wss://s.altnet.rippletest.net:51233', seed: 'sEdTM1uX8pu2do5XvTnutH6HsouMaM2' }

describe('transaction tools', () => {
  it('has a unique submit-* id per tool', () => {
    const ids = submitTools.map(([, tool]) => tool.id)

    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach(id => expect(id).toMatch(/^submit-[a-z-]+$/))
  })

  it('rejects empty input for every tool', () => {
    submitTools.forEach(([name, tool]) => expect(tool.inputSchema.safeParse({}).success, name).toBe(false))
  })

  it('requires a seed: a signed blob goes to submit-signed-blob instead', () => {
    const txn = { Account: account, TransactionType: 'TicketCreate', TicketCount: 3 }
    const ticketCreate = tools.submitTicketCreateTool as unknown as (typeof submitTools)[number][1]

    expect(ticketCreate.inputSchema.safeParse({ network: base.network, signature: 'DEADBEEF', txn }).success).toBe(
      false,
    )
    // submit-signed-blob is the one submit-* tool that takes no transaction fields
    submitTools
      .filter(([name]) => name !== 'submitSignedBlobTool')
      .forEach(([name, tool]) =>
        expect(Object.keys((tool.inputSchema as unknown as { shape: object }).shape), name).toEqual([
          'network',
          'seed',
          'txn',
        ]),
      )
  })

  it.each([
    ['submitTicketCreateTool', { Account: account, TransactionType: 'TicketCreate', TicketCount: 3 }],
    ['submitCheckCancelTool', { Account: account, TransactionType: 'CheckCancel', CheckID: 'A'.repeat(64) }],
    ['submitNFTokenBurnTool', { Account: account, TransactionType: 'NFTokenBurn', NFTokenID: 'B'.repeat(64) }],
  ])('%s accepts a valid transaction', (name, txn) => {
    const tool = tools[name as keyof typeof tools] as unknown as (typeof submitTools)[number][1]

    expect(tool.inputSchema.safeParse({ ...base, txn }).success).toBe(true)
  })

  it.each([
    ['submitTrustSetTool', TrustSetFlags],
    ['submitOfferCreateTool', OfferCreateFlags],
  ])('%s describes every flag with its xrpl.js value', (name, flags) => {
    const { description } = tools[name as keyof typeof tools] as unknown as { description: string }

    Object.entries(flags)
      .filter(([flag]) => isNaN(Number(flag)))
      .forEach(([flag, value]) => expect(description, flag).toContain(`${flag} ${value}`))
  })
})
