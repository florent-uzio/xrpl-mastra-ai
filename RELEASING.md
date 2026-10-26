# Releasing @florent-uzio/xrpl-mcp

The MCP server is published to npm from `packages/xrpl-mcp/`. Releases are driven by [Changesets](https://github.com/changesets/changesets) and published by GitHub Actions from `main`. Nobody publishes from a laptop.

## Choosing the version (semver)

- **Patch**: bug fixes and dependency changes.
- **Minor**: new tools, workflows or environment variables.
- **Major**: removed or renamed tools, changed tool inputs, or a behaviour change that breaks existing Claude Code setups (for example the seed policy or the default records folder).

Changes that do not reach the published bundle (the Mastra app, evals, docs) need no changeset.

## Release steps

1. **In your PR**, run `npm run changeset`, pick `@florent-uzio/xrpl-mcp` and the bump, and write one or two sentences for users. Commit the generated `.changeset/*.md` file with the PR.
2. **Merge the PR.** The [Release workflow](.github/workflows/release.yml) opens (or updates) a `chore: version packages` PR that bumps `packages/xrpl-mcp/package.json`, writes `packages/xrpl-mcp/CHANGELOG.md` and deletes the consumed changesets. Several merged PRs pile up in the same version PR.
3. **Merge the version PR** when you want to release. The workflow then runs `changeset publish`, which:
   - runs the `prepublishOnly` guard (see below) and the `prepack` build of the bundle,
   - publishes to npm with provenance, through npm trusted publishing (OIDC), so no npm token is stored anywhere,
   - pushes the `@florent-uzio/xrpl-mcp@X.Y.Z` git tag and creates the GitHub release with the changelog entry as notes.

## The `prepublishOnly` guard

`packages/xrpl-mcp/release-guard.mjs` runs before every `npm publish` and refuses unless:

- the branch is `main` (`GITHUB_REF_NAME` in GitHub Actions, the current branch locally),
- the working tree is clean,
- `npm test` passes at the repo root.

## One-time setup

- **npm**: on npmjs.com, add a trusted publisher to `@florent-uzio/xrpl-mcp`: GitHub Actions, repository `florent-uzio/xrpl-mastra-ai`, workflow `release.yml`.
- **GitHub**: in Settings → Actions → General, allow GitHub Actions to create and approve pull requests, so the workflow can open the version PR.

## Decision: publish from GitHub Actions

Publishing is automated, as in [custody.js](https://github.com/florent-uzio/custody.js). `1.0.0` was published by hand from a feature branch before its PR was merged; publishing only from the Release workflow on `main` keeps npm in step with `main`, removes the need for a local `npm login`, and adds provenance. There is no beta channel yet.
