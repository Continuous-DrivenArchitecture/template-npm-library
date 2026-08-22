# Compliance: template-npm-library vs. CDA governance contracts

This maps `template-npm-library` against **CDA Repository Baseline v1** and
**CDA npm Library Profile v1** (both `Approved`). Only requirements with an
observable implementation in this repository are listed. Anything that
depends on GitHub/npm configuration outside version control is marked
`EXTERNAL SETUP REQUIRED` — see `runbooks/setup-repository.md`, Section B.
No compliance is claimed for anything not actually verified while building
this template (see the validation log at the end of this file).

## CDA Repository Baseline v1

| Requirement | Implementation | Status |
|---|---|---|
| `main` is the only permanent branch | Repository initialized with `git init -b main`; no other branch created | PASS |
| Short-lived branch prefixes (`feature/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`) | Documented in `CONTRIBUTING.md`, "Branching" | PASS (documentation) |
| Default branch = `main` | Local repo default branch is `main` | PASS locally / `EXTERNAL SETUP REQUIRED` on GitHub |
| PR target = `main` | `.github/workflows/ci.yml` triggers on `pull_request: branches: [main]` | PASS |
| Delete branch on merge = `true` | GitHub repository setting, not a file | EXTERNAL SETUP REQUIRED |
| PR required to merge into `main`, no bypass | `.github/pull_request_template.md` exists; enforcement is a GitHub ruleset | EXTERNAL SETUP REQUIRED |
| Required conversation resolution | Ruleset setting | EXTERNAL SETUP REQUIRED |
| Strict required status checks | Ruleset setting | EXTERNAL SETUP REQUIRED |
| Squash merge only; merge-commit and rebase-merge disabled | `CONTRIBUTING.md` documents squash-only; the merge-method restriction itself is a GitHub repository setting | Documented / EXTERNAL SETUP REQUIRED |
| `Protect main` ruleset, bypass actors = none | Documented as the target in `runbooks/setup-repository.md`, Section B3 | EXTERNAL SETUP REQUIRED |
| Required status checks are a stable, matrix-independent set | `.github/workflows/ci.yml`'s `ci-required` job depends on every real check and exposes one fixed name, independent of the Node version matrix | PASS |
| Default `GITHUB_TOKEN` permissions = read | `ci.yml` sets `permissions: contents: read` at workflow level | PASS |
| Write permissions granted only where needed | Only `release.yml` requests `contents: write` + `id-token: write`; `ci.yml` and `dependency-health.yml` stay read-only | PASS |
| Third-party Actions pinned to full commit SHA | Every `uses:` in `ci.yml`, `release.yml`, `dependency-health.yml` is pinned to a 40-character SHA with the resolved tag in a comment | PASS |
| Allowed-actions policy restricted | GitHub Actions repository setting | EXTERNAL SETUP REQUIRED |
| Minimal secret footprint; no unused secrets | No secrets are defined or referenced by any workflow in this template | PASS |
| No `NPM_TOKEN` | Absent from `.npmrc`, workflows, and repository secrets list | PASS |
| Dependabot targets `main`, weekly, `npm` + `github-actions` | `.github/dependabot.yml` | PASS |
| Dependency-freshness check is informational, not a hard gate | `dependency-health.yml`'s `outdated` job never fails the run (`\|\| true`, writes to `$GITHUB_STEP_SUMMARY` only) | PASS |
| Secret scanning / push protection enabled | GitHub repository setting | EXTERNAL SETUP REQUIRED |
| `SECURITY.md` exists, describes private reporting | `SECURITY.md`, referencing GitHub Private Vulnerability Reporting | PASS |
| `README`, `CONTRIBUTING`, `SECURITY`, `LICENSE` present | All four exist at repository root | PASS |
| `CONTRIBUTING.md` explains branching, commits, PR, release, Action pinning | `CONTRIBUTING.md` covers all five explicitly | PASS |
| No orphaned workflows/environments/Pages/secrets/variables | No environment, no Pages config, no variable is defined; every workflow file is actively referenced by this compliance table | PASS |

## CDA npm Library Profile v1

| Requirement | Implementation | Status |
|---|---|---|
| Source under `src/`, tests under a single consistent convention | `src/index.ts`; `tests/index.test.ts` — `tests/` chosen and documented in `CONTRIBUTING.md`, "Tests" | PASS |
| Build output git-ignored, never committed | `.gitignore` excludes `dist/`; `dist/` produced only by `npm run build` | PASS |
| `package.json` scoped name, `exports`, `types`, `files` allow-list, `engines.node`, `publishConfig.access: public` | All present in `package.json` (placeholder name pending real-repo rename, per README) | PASS |
| `publishConfig.provenance: true` | Present in `package.json` | PASS |
| `type: "module"` as recommended default (SHOULD, not MUST) | `package.json` sets `"type": "module"`; `CONTRIBUTING.md`/profile leave the door open to a documented alternative | PASS |
| Only `exports`-declared surface is public API | `package.json`'s `exports` map has exactly one entry point (`.`), backed by `src/index.ts` | PASS |
| Published tarball excludes `src/`, tests, tooling | `scripts/verify-pack.mjs` asserts this; verified locally — see validation log | PASS |
| `verify-pack` required check | `scripts/verify-pack.mjs`, wired into `ci.yml`'s `package-verification` job, itself required by `ci-required` | PASS |
| Packaged/public-consumption test, multi-Node-version aware | `scripts/verify-package-consumption.mjs` — installs the packed tarball into an out-of-tree fixture, imports via package name only, runtime + `.d.ts` check | PASS |
| CI: typecheck, lint, test, build, verify-pack, consumption test, production audit — required | All implemented as distinct jobs in `ci.yml`, all listed in `ci-required`'s `needs` | PASS |
| SBOM (SHOULD) | `sbom` job in `ci.yml`, `npm sbom --sbom-format=spdx --omit=dev`, uploaded as an artifact, included in `ci-required` | PASS |
| Required check names stable/matrix-independent | `ci-required` job — see baseline row above | PASS |
| Releases only from `main`, semantic-release only | `.releaserc.json`: `"branches": ["main"]`; `release.yml` triggers on `push: branches: [main]` | PASS |
| `main` never written to by the release workflow | `release.yml` contains no push/commit step; no `@semantic-release/git`; verified — see validation log | PASS |
| No `chore(release)` commit | `.releaserc.json` plugin list has no git-commit plugin | PASS |
| `@semantic-release/git` absent | Not installed, not in `.releaserc.json` | PASS |
| Git tag points at the reviewed, squash-merged commit; no intermediate commit | Structural consequence of the plugin set above; confirmed via `@semantic-release/npm` source inspection (see validation log) | PASS (by construction; not exercised against a real remote — see limitations) |
| npm Trusted Publishing / OIDC, no `NPM_TOKEN` | `release.yml`: `id-token: write`, no npm token anywhere; `@semantic-release/npm`'s OIDC support confirmed present in its installed source | PASS |
| Release workflow permissions: `contents: write` + `id-token: write`, `issues`/`pull-requests: write` only if needed | `release.yml` requests exactly `contents: write` + `id-token: write` | PASS |
| No additional GitHub App / sentinel identity | None created, none referenced; `runbooks/setup-repository.md` explicitly documents it as not part of standard setup | PASS |
| CHANGELOG not required via automated commit | No `@semantic-release/changelog`, no committed `CHANGELOG.md`; GitHub Releases is the release-notes record | PASS |
| `package.json` version on `main` is a fixed development placeholder | `"version": "0.0.0-development"`, valid SemVer, confirmed unaffected by a real release dry-run of the version-write mechanism (see validation log) | PASS |
| Version identity source of truth = git tag + GitHub Release + npm registry | Structural — no package has been released, so there is no live example yet | Design verified / not yet exercised (no release has occurred) |
| Tag protection caveat documented | `runbooks/setup-repository.md`, "Ruleset — `Protect main`" table; no tag ruleset created | PASS (documentation) |
| Production dependency audit required check | `audit` job, `npm audit --omit=dev --audit-level=high`, in `ci-required` | PASS |
| Dependabot targets `main` | `.github/dependabot.yml`, no `target-branch` override (defaults to the repository's default branch, `main`) | PASS |
| CodeQL for TypeScript (SHOULD) | Not a file-level concern — repository-level GitHub feature | EXTERNAL SETUP REQUIRED |
| Dependency review on PRs (SHOULD) | Repository-level GitHub feature | EXTERNAL SETUP REQUIRED |
| npm package created, Trusted Publisher bound | No npm package exists for this template (by design — see restrictions) | EXTERNAL SETUP REQUIRED |
| "Legacy / Exceptional release pattern" not used by default | No App, no bypass actor, no `RELEASE_APP_ID`/`RELEASE_APP_PRIVATE_KEY` anywhere in this repository | PASS |

## Validation log (this template repository, local)

All commands below were run against this repository directly; see the
session's tool history for full output.

- `npm ci` — reproduces `package-lock.json` cleanly.
- `npm run typecheck` — passes.
- `npm run lint` — passes (0 errors after fixing one unused import found
  during this build).
- `npm test` — 2/2 tests pass.
- `npm run build` — produces `dist/index.js`, `dist/index.d.ts`.
- `npm run verify-pack` — passes: required export files present; no
  `src/`, `tests/`, or tooling files leaked; `package.json`/`README.md`/
  `LICENSE` present.
- `npm run verify-consumption` — passes: a fresh out-of-tree fixture
  installs the packed tarball, imports it by package name only, calls the
  exported function successfully, and type-checks against the published
  `.d.ts`.
- `npm audit --omit=dev --audit-level=high` — 0 vulnerabilities.
- `npm sbom --sbom-format=spdx --omit=dev` — produces a valid SPDX
  document.
- `npm pack --dry-run` — 6 files, matches `verify-pack`'s expectations.
- `git diff --check` — no whitespace/conflict-marker issues.
- **`@semantic-release/npm`'s version-write mechanism, verified
  empirically, not assumed:** running the exact command its `prepare` step
  runs (`npm version 0.1.0 --no-git-tag-version --allow-same-version`)
  changed `package.json`/`package-lock.json` on disk to `0.1.0` while `git
  log` and `git tag` remained completely unchanged — no commit, no tag.
  The mutation was then reverted (`git checkout -- package.json
  package-lock.json`) to restore the committed `0.0.0-development`
  placeholder. Source of `node_modules/@semantic-release/npm/lib/prepare.js`
  confirms this is the plugin's actual, documented behavior (`npm version
  ... --no-git-tag-version`), not an assumption.
- **`@semantic-release/npm`'s `private: true` guard, verified via
  source:** `node_modules/@semantic-release/npm/lib/publish.js` and
  `index.js` both gate every npm-auth/publish action on `pkg.private !==
  true`. Because this template's `package.json` has `"private": true`,
  a full `semantic-release` run against it would skip npm
  authentication and publishing entirely (not fail loudly) — an
  additional, built-in safety property beyond the raw `npm publish`
  rejection this template's design already relied on.
- **`npx semantic-release --dry-run --no-ci`, attempted:** semantic-release
  loaded configuration and the plugin chain successfully (confirming no
  structural error in `.releaserc.json` and no dependency on
  `@semantic-release/git`), then failed at
  `git ls-remote --heads -- https://github.com/.../REPLACE_ME.git`
  ("Repository not found") — semantic-release's own branch-resolution step
  requires a real, reachable git remote matching `package.json`'s
  `repository.url`. This is the expected, correct outcome: this template
  deliberately has a placeholder repository URL and no GitHub repository
  was created for it (out of scope per the task's restrictions). It is not
  evidence of a defect in the release model; it is evidence the pipeline
  correctly refuses to proceed against a nonexistent remote. A full,
  successful release run was not attempted or claimed — that requires a
  real GitHub repository and npm Trusted Publisher binding, both explicitly
  out of scope here (see `runbooks/setup-repository.md`).
- **Smoke-generation test:** the git-tracked contents of this repository
  (via `git archive`) were extracted into an isolated temporary directory
  outside this workspace, the package was renamed
  (`@smoke-test/derived-library`), dependencies were installed from
  scratch, and the full validation sequence (typecheck, lint, test, build,
  verify-pack, verify-consumption) was re-run there successfully — showing
  no hidden dependency on `archi-semantic-core`, `adapter-xma`, the
  workspace root, or any path outside the template's own tracked files.
  The temporary directory was deleted afterward.

## Limitations of this compliance check

- No real GitHub repository, ruleset, Dependabot/security toggle, or npm
  Trusted Publisher binding was created or exercised. Every row marked
  `EXTERNAL SETUP REQUIRED` is unverified against live infrastructure by
  design — see the task's restrictions and `runbooks/setup-repository.md`.
  Do not read `PASS` on a file-level row as proof the equivalent GitHub/npm
  configuration has been applied anywhere.
- No actual release, tag, or npm publish was performed.
