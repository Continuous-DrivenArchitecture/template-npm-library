# template-npm-library

**This is a template, not a library.** It exists to be copied and turned into
a real `@cda/*` package — it does not ship a real public API of its own.

## What this is

A minimal, fully operational TypeScript npm library that implements
**CDA npm Library Profile v1** (which extends **CDA Repository Standard
v1**) end to end: package structure, CI, package verification, and an
immutable-`main` release pipeline (semantic-release → git tag → GitHub
Release → npm Trusted Publishing). Every file in this repository either
implements a specific rule from those two contracts or is generic scaffolding
a library needs regardless of what it does (a placeholder source file, a
test, tool config).

It intentionally contains **no CDA domain logic**. `src/index.ts` exports a
single trivial function whose only job is to prove the full chain works:
source compiles → builds → ships type declarations → gets correctly packed
→ can be imported by a real consumer that only has the published package,
not this source tree.

## What a new repository must replace

Before this template becomes a real library, replace:

- `package.json`: `name` (currently `@cda/template-npm-library`, a
  placeholder), `description`, `keywords`, `repository`/`homepage`/`bugs`
  URLs (currently pointing at `.../REPLACE_ME`), and remove the top-level
  `"private": true` field — it exists only so this template cannot be
  published by accident.
- `src/index.ts` and `tests/index.test.ts`: replace the placeholder `add`
  function with the library's real public API, exported the same way (via
  the `exports` map in `package.json`).
- `README.md` (this file), `LICENSE` copyright line, and `SECURITY.md`'s
  reporting-channel note.
- `.releaserc.json`'s `branches` field only if the new repository's default
  branch is not `main` — it must not be anything else per the baseline, so
  in practice this does not change.

Everything else — CI structure, the release workflow, `verify-pack`,
`verify-package-consumption.mjs`, Dependabot config, the PR template — is
meant to be kept as-is.

## Initializing a new repository from this template

1. Copy this directory's contents into the new repository (or use it as a
   GitHub template repository once one is created from it — that step is
   external to this template; see `runbooks/setup-repository.md`).
2. Make the replacements listed above.
3. Run the local validation sequence below and confirm it passes.
4. Follow `runbooks/setup-repository.md` for everything that must be
   configured *outside* this repository (GitHub ruleset, Actions settings,
   npm Trusted Publisher) before the first real release.

## Running validations locally

```
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run verify-pack
npm run verify-consumption
npm audit --omit=dev
npm sbom --sbom-format=spdx --omit=dev
npm pack --dry-run
```

`verify-pack` and `verify-consumption` are what actually prove the package
is publishable — passing `npm test` alone is not sufficient (see
CONTRIBUTING.md).

## What still needs external configuration

This repository, on its own, cannot make itself a governed GitHub repository
or an npm-publishable package — that requires configuration outside version
control: the `main` branch ruleset, GitHub Actions repository settings,
Dependabot/security toggles, and the npm Trusted Publisher binding. None of
that is applied by this template. See `runbooks/setup-repository.md` for the
full, explicit list of what's already provided as files here versus what
must still be configured externally.

## Governance contracts implemented

- **CDA Repository Standard v1** — organization-wide branching, PR, merge,
  Actions-security, and hygiene rules that apply to every CDA repository.
- **CDA npm Library Profile v1** — extends the above with npm-library-
  specific rules: package contract, package verification, semantic-release,
  npm Trusted Publishing, and the immutable-`main` release model.

See `COMPLIANCE.md` for a concrete requirement-by-requirement mapping
between those two documents and what this repository actually implements.
