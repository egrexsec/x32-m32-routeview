# Security Policy

## Supported scope
X32/M32 RouteView is currently a client-side scene parsing and visualization tool.

Security-sensitive areas include:
- file parsing behavior
- export generation
- dependency hygiene
- local development server exposure

## Reporting a vulnerability
Please do not open public issues for security-sensitive findings first.

Instead, report with:
- vulnerability summary
- affected file(s) or dependency
- reproduction steps
- impact assessment
- suggested remediation if known

Use GitHub's private vulnerability reporting for this repository:
`https://github.com/egrexsec/x32-m32-routeview/security/advisories/new`.

Do not open a public issue for a vulnerability. If private reporting is unavailable,
contact the maintainer without including exploit details and ask for a private channel.

## Current expectations
Before public release hardening, maintainers should treat these as required:
- keep `npm run lint`, `npm run test`, and `npm run build` green
- review `npm audit` results before releases
- avoid exposing dev tooling outside trusted environments
- prefer typed parsing over dynamic execution patterns

## Out of scope
The following are not currently part of RouteView’s runtime surface:
- hosted account systems
- remote control of consoles
- multi-tenant cloud infrastructure
- authentication or billing flows

If the project expands into live OSC, remote collaboration, or hosted deployments, this policy should be updated accordingly.
