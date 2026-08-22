# Compliance: template-npm-library vs. CDA governance contracts

This maps `template-npm-library` against **CDA Repository Baseline v1** and
**CDA npm Library Profile v1** (both `Approved`). Only requirements with an
observable implementation are listed. As of this revision, the repository
lives at `Continuous-DrivenArchitecture/template-npm-library` (public,
template) and the GitHub-side configuration below has been applied and
verified live via the GitHub API — see "GitHub configuration (verified
live)". Anything still marked `EXTERNAL SETUP REQUIRED` genuinely has not
been applied (npm package/Trusted Publisher, and a small number of
GitHub features with no bare API toggle) — see
`runbooks/setup-repository.md`, Section B. No compliance is claimed for
anything not actually verified (see the validation log at the end of this
file).

## CDA Repository Baseline v1

| Requirement | Implementation | Status |
|---|---|---|
| `main` is the only permanent branch | Repository initialized with `git init -b main`; no other branch created | PASS |
| Short-lived branch prefixes (`feature/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`) | Documented in `CONTRIBUTING.md`, "Branching" | PASS (documentation) |
| Default branch = `main` | GitHub `default_branch` field verified via API = `main` | PASS |
| PR target = `main` | `.github/workflows/ci.yml` triggers on `pull_request: branches: [main]` | PASS |
| Delete branch on merge = `true` | Verified via API: `delete_branch_on_merge: true` | PASS |
| PR required to merge into `main`, no bypass | `Protect main` ruleset created; `pull_request` rule active, `bypass_actors: []`, `current_user_can_bypass: "never"` — verified via API | PASS |
| Required conversation resolution | `required_review_thread_resolution: true` on the `Protect main` ruleset — verified via API | PASS |
| Strict required status checks | `strict_required_status_checks_policy: true` on the `Protect main` ruleset — verified via API | PASS |
| Squash merge only; merge-commit and rebase-merge disabled | Verified via API: `allow_squash_merge: true`, `allow_merge_commit: false`, `allow_rebase_merge: false`; ruleset's `pull_request` rule also restricts `allowed_merge_methods` to `["squash"]` | PASS |
| `Protect main` ruleset, bypass actors = none | Ruleset id 21189927, `enforcement: active`, `bypass_actors: []` — verified via API | PASS |
| Required status checks are a stable, matrix-independent set | `.github/workflows/ci.yml`'s `ci-required` job depends on every real check and exposes one fixed name, independent of the Node version matrix | PASS |
| Default `GITHUB_TOKEN` permissions = read | `ci.yml` sets `permissions: contents: read` at workflow level | PASS |
| Write permissions granted only where needed | Only `release.yml` requests `contents: write` + `id-token: write`; `ci.yml` and `dependency-health.yml` stay read-only | PASS |
| Third-party Actions pinned to full commit SHA | Every `uses:` in `ci.yml`, `release.yml`, `dependency-health.yml` is pinned to a 40-character SHA with the resolved tag in a comment | PASS |
| Allowed-actions policy restricted | Verified via API: `allowed_actions: selected`, `github_owned_allowed: true`, `verified_allowed: false`, `patterns_allowed: []` — covers exactly the 3 GitHub-owned actions this template uses (`actions/checkout`, `actions/setup-node`, `actions/upload-artifact`) | PASS |
| SHA pinning enforcement | Verified via API: `sha_pinning_required: true` (repository-level) | PASS |
| Minimal secret footprint; no unused secrets | No secrets are defined or referenced by any workflow in this template | PASS |
| No `NPM_TOKEN` | Absent from `.npmrc`, workflows, and repository secrets list | PASS |
| Dependabot targets `main`, weekly, `npm` + `github-actions` | `.github/dependabot.yml` | PASS |
| Dependency-freshness check is informational, not a hard gate | `dependency-health.yml`'s `outdated` job never fails the run (`\|\| true`, writes to `$GITHUB_STEP_SUMMARY` only) | PASS |
| Secret scanning / push protection enabled | Verified via API: `security_and_analysis.secret_scanning.status: enabled`, `secret_scanning_push_protection.status: enabled` | PASS |
| Dependabot security alerts enabled | Verified via API: `GET /vulnerability-alerts` returns 204 (enabled) | PASS |
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
| CI: typecheck, lint, test, build, verify-pack, consumption test, production audit — required | All implemented as distinct jobs in `ci.yml`, all listed in `ci-required`'s `needs`. A real gap was found and fixed during this rollout: the `package-verification` job originally ran `verify-pack`/`verify-consumption` without building first, which failed on the very first push to GitHub (dist/ didn't exist in that job's checkout) even though it had passed in every local run (build was always run manually first there). Fixed in commit `6060918`; the corrected workflow subsequently ran green on GitHub — see the validation log | PASS |
| SBOM (SHOULD) | `sbom` job in `ci.yml`, `npm sbom --sbom-format=spdx --omit=dev`, uploaded as an artifact, included in `ci-required` | PASS |
| Required check names stable/matrix-independent | `ci-required` job, registered as the sole required status check on the `Protect main` ruleset (`{"context":"ci-required"}`) — verified via API, and the check has a real successful run recorded (run 32561004185) | PASS |
| Releases only from `main`, semantic-release only | `.releaserc.json`: `"branches": ["main"]`; `release.yml` triggers on `push: branches: [main]` | PASS |
| `main` never written to by the release workflow | `release.yml` contains no push/commit step; no `@semantic-release/git`. The real `Release` workflow run triggered by the initial push and by the CI-fix push both failed cleanly at semantic-release's own `git ls-remote` step (placeholder `repository.url`, exit 128) before reaching any git-writing step; `git ls-remote --tags origin` and `gh release list` both confirm zero tags/Releases exist on the live repository — see validation log | PASS |
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
| CodeQL for TypeScript (SHOULD) | Enabled via GitHub's file-free "default setup" API (`PATCH .../code-scanning/default-setup`, `state: configured`) — no workflow file added, consistent with deferring a hand-written CodeQL workflow. First scan run (id 32560959672) completed successfully | PASS |
| Dependency review on PRs (SHOULD) | Public repositories get the dependency-graph-based PR diff automatically; there is no separate bare API toggle to verify, and adding the `dependency-review-action` workflow to *enforce* it was deliberately not done this session (same reasoning as CodeQL: no new workflow file during this rollout) | EXTERNAL SETUP REQUIRED (enforcement workflow deferred as next capability) |
| npm package created, Trusted Publisher bound | No npm package exists for this template (by design — see restrictions) | EXTERNAL SETUP REQUIRED |
| "Legacy / Exceptional release pattern" not used by default | No App, no bypass actor, no `RELEASE_APP_ID`/`RELEASE_APP_PRIVATE_KEY` anywhere in this repository | PASS |

## GitHub configuration (verified live via API)

`Continuous-DrivenArchitecture/template-npm-library`, checked via `gh api` after applying it:

- Visibility: public. `is_template: true`.
- Default branch: `main`. Only `main` exists (no `develop`, no other branch).
- `delete_branch_on_merge: true`, `allow_squash_merge: true`,
  `allow_merge_commit: false`, `allow_rebase_merge: false`,
  `allow_auto_merge: false`.
- Actions: `enabled: true`, `allowed_actions: selected`
  (`github_owned_allowed: true`, `verified_allowed: false`,
  `patterns_allowed: []`), `sha_pinning_required: true`,
  `default_workflow_permissions: read`, `can_approve_pull_request_reviews: false`.
- `security_and_analysis`: `secret_scanning: enabled`,
  `secret_scanning_push_protection: enabled`,
  `dependabot_security_updates: enabled`. `vulnerability-alerts: enabled`
  (Dependabot alerts).
- CodeQL default setup: `state: configured` (languages: javascript-typescript,
  actions), enabled without adding a workflow file.
- Ruleset `Protect main` (id `21189927`), `target: branch`,
  `enforcement: active`, `bypass_actors: []`, `current_user_can_bypass: never`:
  - `pull_request`: required, `required_approving_review_count: 0`
    (single-maintainer exception, per baseline), `dismiss_stale_reviews_on_push: true`,
    `require_code_owner_review: false`, `required_review_thread_resolution: true`,
    `allowed_merge_methods: ["squash"]`.
  - `required_status_checks`: `strict_required_status_checks_policy: true`,
    `required_status_checks: [{"context":"ci-required"}]`.
  - `non_fast_forward` (force-push blocked), `deletion` (branch deletion blocked).
  - Legacy branch protection (`GET .../branches/main/protection`) confirmed
    unused (404 "Branch not protected") — Rulesets are the sole enforcement
    mechanism, per the baseline.

Not applied (see "Limitations" and `runbooks/setup-repository.md`, Section B):
npm package creation, npm Trusted Publisher binding, the `dependency-review-action`
enforcement workflow, CODEOWNERS (not required at 0-approval single-maintainer
state).

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
- **Live GitHub CI, post-rollout:** the initial push's `CI` run failed
  (`package-verification` job ran `verify-pack`/`verify-consumption` without
  building first — a real gap this local-only validation log hadn't caught,
  since every local run up to that point had `npm run build` executed
  manually beforehand). Fixed in commit `6060918` ("fix(ci): build before
  verify-pack/verify-consumption..."); the next `CI` run on `main`
  (32561004185) passed all jobs including `ci-required`.
- **Live GitHub Release, post-rollout:** both automatic `Release` runs
  (triggered by `push: branches: [main]`, not manually dispatched) failed at
  `git ls-remote --heads -- https://github.com/.../REPLACE_ME.git` ("Repository
  not found", exit 128) — semantic-release's own remote-resolution step,
  reached before any plugin's `verifyConditions`/`prepare`/`publish` step.
  `git ls-remote --tags origin` and `gh release list` against the live
  repository both return empty, confirming no tag and no GitHub Release
  exist.

## Limitations of this compliance check

- The GitHub repository, ruleset, Actions/security settings, and CodeQL
  default setup described above are real and were verified live via the
  GitHub API — see "GitHub configuration (verified live via API)".
- No npm package was created and no npm Trusted Publisher was configured —
  those remain `EXTERNAL SETUP REQUIRED`, by design (out of scope for this
  rollout; this template must never be able to publish itself).
- No actual release, git tag, or GitHub Release was created. Two real
  `Release` workflow runs did fire automatically (an inherent consequence of
  `release.yml` triggering on every push to `main`, not a manual dispatch),
  and both failed cleanly and as expected at semantic-release's own remote
  check, before any publish/tag/write step — see the validation log.
- `npm publish`, `npm login`, npm token creation, Trusted Publisher setup,
  a real `semantic-release` run, and manual release triggering were not
  performed, per the task's restrictions.
