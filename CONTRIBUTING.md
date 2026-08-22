# Contributing

This repository implements two authoritative CDA governance contracts:
**CDA Repository Baseline v1** and **CDA npm Library Profile v1** (maintained
in the `Continuous-DrivenArchitecture` organization's standards documentation;
consult your organization's copy of `docs/standards/` for the full text).
Those documents are authoritative; this file explains how they apply here in
practice, and does not restate them in full.

## Branching

- **`main`** is the only permanent branch.
- All other branches are short-lived and use one of: `feature/*`, `fix/*`,
  `chore/*`, `docs/*`, `refactor/*`.
- `main` is never written to outside a pull request — not by a contributor,
  not by CI, not by the release workflow (see "Release," below).

Flow:

```
branch from main (feature/*, fix/*, chore/*, docs/*, refactor/*)
  → change
  → pull request targeting main
  → required checks (CI)
  → squash merge
  → main
  → branch deleted automatically
```

## Commits and pull requests

- Title your PR as a [Conventional Commit](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `build:`, `ci:`,
  with `!` or a `BREAKING CHANGE:` footer for breaking changes).
- Merges are **squash-only**. The PR title/squash-merge message — not your
  individual in-branch commits — is what lands on `main` and is what
  `semantic-release` parses to compute the next version. In-branch commit
  hygiene is a courtesy, not load-bearing.
- Keep `npm run typecheck`, `npm run lint`, and `npm test` passing before
  opening a PR.
- Pin every third-party GitHub Action to its **full commit SHA**, never a
  floating tag — see the pinned actions in `.github/workflows/*.yml` for the
  pattern, and resolve a new SHA via
  `gh api repos/<owner>/<action>/git/refs/tags` (or the action's GitHub
  Releases page) before adding or bumping one.
- Don't edit `package.json`'s `version` field or hand-maintain a changelog —
  see "Release," below.

## Tests

Tests live under `tests/`, not `test/`. This template intentionally aligns
with the convention already in use in `adapter-xma` and the current CDA
ecosystem; the CDA npm Library Profile permits either as long as a given
repository is internally consistent. `tests/` is the chosen convention for
every repository derived from this template — don't mix the two.

## Release

Releases are cut only from `main`, automatically, by `semantic-release`:

```
squash-merged PR on main
  → semantic-release
  → next version computed from Conventional Commits since the last release
  → git tag (vX.Y.Z)
  → GitHub Release
  → npm publish (Trusted Publishing / OIDC)
```

`main` is never written to as part of this — there is no `chore(release)`
commit, and `@semantic-release/git` is deliberately not part of this
template's plugin set. `package.json`'s `version` field on `main` stays at
the fixed development placeholder `0.0.0-development`; it is not, and is not
meant to be, the current published version. The authoritative record of the
latest release is the agreement between the git tag, the GitHub Release, and
the npm registry version — see the npm Library Profile's "Version source of
truth."

Publishing uses **npm Trusted Publishing (OIDC)** — there is no `NPM_TOKEN`
in this repository, and none should be added.

## Package structure

- `src/` — source. Only what's re-exported from `src/index.ts` (and reached
  through the `exports` map in `package.json`) is public API.
- `tests/` — tests, run against the source tree during CI.
- `dist/` — build output. Never committed; always produced by `npm run
  build` before it's needed (packaging, publishing, or package-verification
  checks).
- `scripts/verify-pack.mjs` — validates the exact tarball `npm publish`
  would send: required export files present, nothing from `src/`, `tests/`,
  or repo tooling leaked in.
- `scripts/verify-package-consumption.mjs` — installs the packed tarball
  into a throwaway project outside this repository and imports it purely
  through its public entry points, proving the published package (not just
  the source tree) actually works for a consumer.

Both scripts run in CI (see `.github/workflows/ci.yml`) and are required
status checks, via the `ci-required` job.
