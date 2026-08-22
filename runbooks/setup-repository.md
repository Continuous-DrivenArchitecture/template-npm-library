# Runbook: setting up a repository from `template-npm-library`

This runbook is the operational checklist for turning a copy of this
template into a real, governed `@cda/*` repository. It implements **CDA
npm Library Profile v1** (which extends **CDA Repository Standard v1**),
release model **B — immutable main**.

It is written for a human running this manually today. It is designed to
become the input for a future `gh`/API automation — every "Section B" item
below is something that automation would eventually apply via API calls,
not by hand.

No step in this runbook has been executed against a real GitHub repository
or npm package as part of producing this template. Everything under
Section B is a target, not a completed action.

---

## Section A — What this template already provides as files

Nothing further needs to be written by hand for these; they exist in the
repository already and only need the placeholder values replaced (see
`README.md`, "What a new repository must replace"):

- `package.json` — scoped package name (placeholder), ESM-first with a
  documented opt-out, explicit `exports`/`types`, `files` allow-list,
  `engines.node`, `publishConfig.access: public`, `publishConfig.provenance:
  true`, `version: 0.0.0-development` as a fixed development placeholder.
- `src/index.ts`, `tests/index.test.ts` — placeholder public API and test,
  demonstrating the source → build → declarations → exports chain.
- `tsconfig.json`, `tsconfig.build.json`, `eslint.config.mjs`,
  `vitest.config.ts` — minimal tool configuration.
- `.github/workflows/ci.yml` — typecheck, lint, test (Node 20/22/24 matrix),
  package verification (`verify-pack` + `verify-consumption`), production
  audit, SBOM, and the stable `ci-required` summary job.
- `.github/workflows/release.yml` — semantic-release, immutable-`main`,
  OIDC-ready, no App, no static npm token.
- `.github/workflows/dependency-health.yml` — informational-only outdated
  dependency report.
- `.github/dependabot.yml` — `npm` + `github-actions`, weekly, targeting
  `main`.
- `.github/pull_request_template.md`.
- `scripts/verify-pack.mjs`, `scripts/verify-package-consumption.mjs`.
- `CONTRIBUTING.md`, `SECURITY.md`, `README.md`, `LICENSE`.
- `.releaserc.json` — `branches: ["main"]`, commit-analyzer /
  release-notes-generator / npm / github plugins only — no
  `@semantic-release/git`, no `@semantic-release/changelog`.
- `.npmrc` — `ignore-scripts=true`.

## Section B — What must be configured externally (not yet applied)

Nothing in this section has been executed. Applying it requires a real
GitHub repository and, for the npm items, a real npm package — neither
exists yet for a template.

### B1. GitHub repository settings

| Setting | Target value |
|---|---|
| Default branch | `main` |
| Delete branch on merge | `true` |
| Allow squash merging | `true` |
| Allow merge commits | `false` |
| Allow rebase merging | `false` |
| Allow auto-merge | organization default; not required by the baseline |

### B2. GitHub Actions repository settings

| Setting | Target value |
|---|---|
| Actions permissions | Enabled |
| Allowed actions | Restricted to GitHub-verified actions / an explicit allow-list (CDA Repository Baseline v1, "GitHub Actions permissions" — SHOULD) |
| Default workflow permissions | Read repository contents permission (`read`) |
| Workflows can approve PRs | `false` |
| SHA pinning required | `true`, where the plan/tier supports the setting (SHOULD) |

### B3. Ruleset — `Protect main`

Target: `~DEFAULT_BRANCH` (i.e., `main`).

| Rule | Target value |
|---|---|
| Require a pull request before merging | ✅ |
| Required approving review count | 0 for a documented single-maintainer repository; ≥1 otherwise (CDA Repository Baseline v1, "Pull requests") |
| Dismiss stale reviews on push | ✅ |
| Require code owner review | only once a CODEOWNERS file exists |
| Require conversation resolution | ✅ |
| Required status checks | exactly `ci-required` from `.github/workflows/ci.yml` — **not** the individual matrix-leg job names |
| Strict status checks (branch must be up to date) | ✅ |
| Block force pushes | ✅ |
| Block branch deletion | ✅ |
| **Bypass actors** | **none** — this is the defining difference from the pattern originally observed in `archi-semantic-core`. No App, no automation identity, no exception. See the npm Library Profile's "Legacy / Exceptional release pattern" for the one narrow, documented case in which a future repository might justify one — it does not apply here. |

### B4. Dependabot / security settings

- Dependabot version updates: the config file (`.github/dependabot.yml`) is
  already in the repo; confirm it's picked up after the repository is
  created.
- Dependabot security alerts (vulnerability alerts): enable.
- Secret scanning: enable.
- Push protection: enable (follows automatically once secret scanning is
  on).
- Dependency review on PRs: enable, where the plan/tier supports it.
- CodeQL (TypeScript): enable — the npm Library Profile raises this to
  SHOULD for published libraries specifically.

### B5. npm

- Create the package on npmjs.com under the real (non-placeholder) name
  chosen for the new repository, or let the first `semantic-release` run
  create it if the account/org permissions allow first-publish-via-CI (npm
  Trusted Publishing supports both, depending on npm's current rules for
  first-time publishes of a scoped package — verify at setup time rather
  than assuming).
- Configure **npm Trusted Publishing** ("Publish from GitHub Actions") on
  the package's npmjs.com settings page, bound to:
  - the exact GitHub organization/repository (`Continuous-DrivenArchitecture/<repo>`);
  - the exact workflow file (`.github/workflows/release.yml`).
- Do **not** create or store an `NPM_TOKEN`. This template's release
  workflow does not read one, has no fallback path that would use one, and
  none should be added — see CDA npm Library Profile v1, "npm Trusted
  Publishing."
- Confirm the org/account enforces 2FA, independent of this template.

### B6. What is deliberately absent (do not add during setup)

- No `develop` branch, no release branch.
- No `cda-release-sentinel` (or equivalent) GitHub App — not needed under
  the immutable-`main` release model this template implements. See the npm
  Library Profile's "Legacy / Exceptional release pattern" if a specific,
  documented technical need ever arises; it is not part of standard setup.
- No `RELEASE_APP_ID` / `RELEASE_APP_PRIVATE_KEY` secrets.
- No `NPM_TOKEN` secret.
- No ruleset bypass actor of any kind on `main`.

---

## Why Section B is not executed by this runbook (yet)

This runbook is deliberately a checklist, not a script. Executing it
requires state that doesn't exist for a template (`gh repo create`, real
ruleset API calls, real Dependabot/security toggles, a real npm Trusted
Publisher binding) and is explicitly out of scope for producing the
template itself. A future automation (generator CLI, `gh` scripts,
reusable workflow, org-level ruleset template) is expected to consume this
runbook's Section B as its literal input.
