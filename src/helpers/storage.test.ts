import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getProjectRoot, getStorageUrl } from './storage'

describe('storage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('uses the working directory as the project root', () => {
    vi.spyOn(process, 'cwd').mockReturnValue(path.join(path.sep, 'repo'))
    expect(getProjectRoot()).toBe(path.join(path.sep, 'repo'))
    expect(getStorageUrl()).toBe(`file:${path.join(path.sep, 'repo', 'mastra.db')}`)
  })

  it('strips .mastra/output when run by mastra dev', () => {
    vi.spyOn(process, 'cwd').mockReturnValue(path.join(path.sep, 'repo', '.mastra', 'output'))
    expect(getProjectRoot()).toBe(path.join(path.sep, 'repo'))
    expect(getStorageUrl()).toBe(`file:${path.join(path.sep, 'repo', 'mastra.db')}`)
  })
})
