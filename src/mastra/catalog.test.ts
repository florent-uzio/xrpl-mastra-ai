import { describe, expect, it } from 'vitest'
import { allTools, coreTools, searchableTools, workflows } from './catalog'
import * as toolsBarrel from './tools'

const barrelToolNames = Object.entries(toolsBarrel)
  .filter(([, value]) => typeof value === 'object' && value !== null && 'id' in value && 'execute' in value)
  .map(([name]) => name)
  .sort()

describe('catalog', () => {
  it('lists every tool of the tools barrel exactly once', () => {
    expect(barrelToolNames.length).toBeGreaterThan(100)
    expect(Object.keys(allTools).sort()).toEqual(barrelToolNames)
  })

  it('keeps core tools out of the searchable ones', () => {
    expect(Object.keys(coreTools).filter(name => name in searchableTools)).toEqual([])
  })

  it('lists only tools that exist', () => {
    for (const tool of Object.values(coreTools)) expect(tool).toBeDefined()
  })

  it('names each workflow once, in kebab case', () => {
    expect(Object.keys(workflows)).toEqual(['iou-issuance', 'mpt-issuance', 'confidential-mpt', 'lending-setup'])
  })
})
