// Runs before `npm publish`: refuses to publish anything that is not tested, committed code on main.
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const run = command => execSync(command, { cwd: root, encoding: 'utf8' }).trim()
const refuse = reason => {
  console.error(`Refusing to publish: ${reason}. See RELEASING.md.`)
  process.exit(1)
}

// GitHub Actions checks out a detached HEAD, so the branch comes from its env there.
const branch = process.env.GITHUB_REF_NAME || run('git branch --show-current')
if (branch !== 'main') refuse(`on branch "${branch}", not main`)
if (run('git status --porcelain')) refuse('the working tree has uncommitted changes')

try {
  execSync('npm test', { cwd: root, stdio: 'inherit' })
} catch {
  refuse('tests failed')
}
