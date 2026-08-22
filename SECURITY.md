# Security Policy

## Supported versions

Only the latest version published on the npm registry is supported with
security fixes. Patch releases are cut automatically from `main` (see
CONTRIBUTING.md) — keep the package updated to receive fixes promptly.

## Reporting a vulnerability

**Do not open a public GitHub issue for a security vulnerability.**

Report it privately using GitHub's Private Vulnerability Reporting for this
repository: open the repository's **Security** tab → **Advisories** →
**Report a vulnerability**. This is a GitHub platform feature that does not
require a separate contact address.

> This template does not define a maintainer contact address. A repository
> derived from this template MUST either enable and rely on GitHub Private
> Vulnerability Reporting (recommended default), or replace this section
> with a real, monitored reporting channel before publishing the package —
> do not leave a placeholder email address in place of either.

When filing a report, include:

- the affected package version and how it was obtained;
- a minimal reproduction;
- the impact you observed or suspect.

## What happens next

1. The maintainer acknowledges the report and triages it.
2. A fix is prepared and released as a patch version through the normal,
   automated release pipeline (see CONTRIBUTING.md).
3. The fix ships with release notes referencing the issue; a GitHub Security
   Advisory is published once the fix is available, and the issue is
   disclosed publicly only after coordination with the reporter.
