import path from 'node:path'

/**
 * The project root: `mastra dev` runs from `<project root>/.mastra/output`, so it is whatever precedes `.mastra`.
 * Anything else (tests, `npm run eval`) runs from the project root itself.
 */
export const getProjectRoot = () => {
  const cwd = process.cwd()
  const marker = `${path.sep}.mastra${path.sep}`
  const markerIndex = cwd.indexOf(marker)
  return markerIndex === -1 ? cwd : cwd.slice(0, markerIndex)
}

/** LibSQL URL of `<project root>/mastra.db` (git-ignored), shared by agent memory, scores, datasets and experiments. */
export const getStorageUrl = () => `file:${path.join(getProjectRoot(), 'mastra.db')}`
