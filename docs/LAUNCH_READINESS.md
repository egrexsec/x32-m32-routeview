# RouteView Launch Readiness Report

Audit date: 2026-07-15  
Release candidate: 1.0.0  
Target: <https://x32-m32-routeview.vercel.app>

## Decision

**Approve after the production checklist is completed.** The repository is ready to
produce a first public release: its supported scope is clear, core automated gates
pass, parsing is conservative, scene data remains client-side, and unsupported
content stays visible. Approval does not mean every X32/M32 scene command is
normalized; that limitation is explicit and is appropriate for 1.0.0.

## Scorecard

| Category | Score | Evidence and remaining risk |
| --- | ---: | --- |
| Architecture | 8/10 | Typed parser/domain/export separation; some large presentation components remain. |
| Code quality | 8/10 | Clean lint/build; conservative refactors only. |
| Parser stability | 8/10 | Parser never executes scene content, retains unknown categories, and has regression tests; real-firmware corpus is still limited. |
| UI polish | 8/10 | Clear three-step volunteer workflow, demo, upload states, advanced-details disclosure, and print view. |
| Accessibility | 7/10 | Semantic landmarks, labels, keyboard-operable upload, live status, focus styles, and responsive layout; no formal screen-reader/high-contrast certification. |
| Performance | 8/10 | Client-only static build; 383 kB main JS (117 kB gzip) at audit time; no route-level splitting needed for this single-page scope. |
| Security | 8/10 | No server-side scene processing, HTML export escaping, file limit, zero known production dependency advisories, CodeQL and Dependabot added. |
| Documentation | 9/10 | Product README, contributor/security guidance, screenshots, workflow, roadmap, launch/release/runbook docs. |
| Maintainability | 8/10 | TypeScript, tests, CI, CODEOWNERS, focused domain modules; parser fixture breadth should grow. |
| Testing | 7/10 | 17 automated tests cover parser/model/topology/upload/export; automated browser and accessibility suites remain future work. |
| Release readiness | 8/10 | SemVer, changelog, CI/security automation, deployment/rollback/monitoring checklists; branch rules and GitHub metadata need owner-side confirmation. |
| Contributor experience | 9/10 | Contributing guide, issue forms, PR template, CI, safety guidance, ownership. |
| Portfolio value | 9/10 | Clear niche, production-oriented workflow, screenshots, tests, typed architecture, and transparent limitations. |
| Church volunteer usability | 8/10 | Plain-language guide, demo-first entry, primary PDF action, and advanced details collapsed. |
| Recruiter impression | 9/10 | Demonstrates product judgment, domain modeling, defensive parsing, documentation, QA, and release operations. |

## Workflows tested

| Workflow | Result | Notes |
| --- | --- | --- |
| Import X32/M32 `.scn` | Pass | Extension, empty-file, and 10 MB checks precede local parsing. |
| Demo scene | Pass | Builds a populated volunteer guide without a private customer file. |
| Search channels/routes | Pass | Production-sheet search, no-results feedback, reset, and highlighted results are implemented. |
| Inspect routing/unsupported parameters | Pass | Normalized routing and parser buckets remain distinct; advanced details are collapsed by default. |
| Export/download reports | Pass | Markdown, HTML, JSON, text, CSV, and print/PDF paths are implemented and exporter-tested. |
| Invalid or unsupported scene | Pass | Produces an Unsupported state and plain-language warning without throwing. |
| Empty/malformed scene | Pass with limitation | Empty upload rejected; structurally unrecognized text yields a conservative warning. |
| Duplicate upload | Pass | A replacement import replaces current in-memory state; no server or persistent duplicate exists. |
| Huge scene | Pass | Files above 10 MB are rejected before reading. |
| Firmware mismatch | Partial by design | Firmware is not reliably encoded in every scene; unknown commands remain visible for reporting. |
| Unsupported console | Pass | Rejected as unsupported instead of being misrepresented as X32/M32. |
| Mobile/responsive | Pass | Browser-tested at 390x844 after correcting production-sheet header overflow; no document overflow or escaped elements remained. |

## Issues discovered and disposition

### Fixed for 1.0.0

- Package version was still `0.0.0`; set to `1.0.0`.
- No automated pull-request gate; added lint, test, and build CI.
- No security scanning or dependency-update policy; added CodeQL and Dependabot.
- Contributor intake was incomplete; added bug form, PR template, issue routing, and CODEOWNERS.
- Security guidance suggested a public issue fallback; replaced it with private advisory guidance.
- Website metadata lacked canonical, Open Graph image, Twitter card, theme color, and structured application data.
- Release operations were undocumented; added this report, release notes, limitations, deployment, rollback, and monitoring procedures.

### Remaining technical debt

- Grow a sanitized fixture corpus across X32/M32 models, editors, and firmware generations.
- Break the parser into command-family modules when coverage expansion makes that simpler, not preemptively.
- Add automated browser flows and accessibility checks (axe plus screen-reader smoke tests).
- Measure large-but-valid scene parsing on representative low-power volunteer laptops.
- Remove unused scaffolded UI dependencies/components only after import and bundle analysis proves they are unused.
- Add visual regression coverage for print/PDF output.

## Known limitations

- RouteView supports X32/M32 `.scn` text scenes only; it does not support every console family or binary show format.
- Unknown commands are summarized, not guessed. A `Parsed` result is documentation, not a guarantee that every console parameter is modeled.
- Firmware/model inference is limited by what a scene file contains.
- PDF generation uses the browser print dialog, so pagination can vary by browser and paper settings.
- All work is local to the browser; there are no accounts, cloud backups, collaboration, or console control.
- Very large files above 10 MB are intentionally rejected.

## v1.1 candidates

- sanitized multi-firmware fixture pack and parser coverage dashboard
- automated accessibility and end-to-end import/export tests
- improved print pagination presets and export regression snapshots
- clearer firmware/model context entry when the scene omits it

## v2.0 candidates

- scene-to-scene diff with routing-risk summaries
- additional console families through separate typed parser adapters
- optional offline installability if it preserves the local-only privacy model
- shareable, explicitly opt-in collaboration packages without uploading by default

## GitHub owner actions

- Set description: `Volunteer-friendly routing documentation for Behringer X32 and Midas M32 scene files.`
- Set homepage to `https://x32-m32-routeview.vercel.app`.
- Add topics: `x32`, `m32`, `live-audio`, `church-tech`, `routing`, `react`, `typescript`.
- Upload a 1280x640 social preview and enable Discussions only if there is capacity to moderate it.
- Protect `main`: require pull requests, CI, CodeQL, conversation resolution, and no force pushes.
- Enable private vulnerability reporting and secret scanning where available.
- Create signed or annotated tag `v1.0.0` only after production acceptance.

## Approval rationale

RouteView has a narrow, useful promise and now supports it with a defensively designed
local parser, clear volunteer workflow, reliable exports, automated quality gates,
open-source governance, and explicit limitations. Remaining work improves breadth and
assurance rather than correcting a known release-blocking defect.
