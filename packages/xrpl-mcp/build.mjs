// Bundles the MCP server with all its npm packages, so the published package has no dependencies.
import { build } from 'esbuild'
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgDir = dirname(fileURLToPath(import.meta.url))
const root = join(pkgDir, '../..')

const { metafile } = await build({
  // metafile input paths are relative to this
  absWorkingDir: root,
  entryPoints: [join(root, 'src/mcp/stdio.ts')],
  outfile: join(pkgDir, 'dist/xrpl-mcp.js'),
  bundle: true,
  minify: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  metafile: true,
  // Bundled CommonJS packages call require(), which ESM output lacks.
  banner: {
    js: "#!/usr/bin/env node\nimport { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
})

// The bundle ships third-party code, so it ships their license notices too.
const packageDirs = new Set()
for (const input of Object.keys(metafile.inputs)) {
  const match = input.match(/^(.*node_modules\/(?:@[^/]+\/)?[^/]+)\//)
  if (match) packageDirs.add(join(root, match[1]))
}

const notices = [...packageDirs].sort().map(dir => {
  const { name, version, license } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const licenseFile = readdirSync(dir).find(file => /^(licen[cs]e|copying)/i.test(file))
  const text = licenseFile ? readFileSync(join(dir, licenseFile), 'utf8').trim() : `License: ${license}`
  return `${name}@${version} (${relative(root, dir)})\n\n${text}`
})
writeFileSync(join(pkgDir, 'dist/THIRD_PARTY_LICENSES.txt'), notices.join(`\n\n${'-'.repeat(80)}\n\n`) + '\n')

for (const file of ['README.md', 'LICENSE']) {
  copyFileSync(join(root, file), join(pkgDir, file))
}
