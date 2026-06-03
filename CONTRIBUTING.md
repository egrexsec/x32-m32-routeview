# Contributing to X32/M32 RouteView

Thanks for helping improve RouteView.

## What this project is
RouteView is a parser-driven routing documentation and visualization tool for live audio consoles, starting with Behringer X32 and Midas M32 scene files.

Core priorities:
- trustworthy routing interpretation
- low-noise engineering UX
- conservative parsing
- readable exports and troubleshooting views
- stable foundations for future live and multi-console support

## What this project is not
Please avoid steering contributions toward:
- generic SaaS dashboards
- AI-first features
- management/admin bloat
- visual complexity that reduces signal clarity

## Development workflow
1. Fork the repo and create a focused branch.
2. Keep changes scoped to one problem.
3. Run the quality checks before opening a PR:
   - `npm install`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
4. Open a PR with:
   - the problem being solved
   - the approach taken
   - screenshots for UI changes
   - fixture/test coverage for parser or domain changes

## Contribution standards

### Parser changes
Parser work must be conservative and regression-tested.

If you change parser behavior:
- add or update fixture-based tests
- preserve unknown lines instead of silently discarding them
- prefer typed normalization over display-string hacks
- document newly supported routing constructs in the PR

### UI/UX changes
UI changes should make the tool feel more like an engineering console tool, not more like a consumer dashboard.

Good changes:
- better information hierarchy
- denser but readable layout
- stronger route legibility
- clearer parse limitations
- more reusable workspace patterns

Avoid:
- decorative motion
- marketing-style visual noise
- excessive empty space
- trendy abstractions without operator value

### Architecture changes
Prefer:
- thin React components
- domain logic in `src/lib` / parser modules
- typed route relationships
- testable selectors and derived models

Avoid:
- pushing business logic into JSX
- string-matching when a typed model is possible
- broad refactors without test coverage

## Pull request sizing
Preferred PR shape:
- one feature
- one refactor
- one test expansion

Large mixed PRs are harder to review and more likely to regress parser behavior.

## Roadmap-aligned areas
High-value contributions include:
- parser coverage expansion
- stereo/link and matrix modeling
- route graph normalization
- scene comparison/diff primitives
- export reliability
- accessibility and dense workflow improvements
- documentation for contributors and operators

## Reporting bugs
When opening an issue, include:
- scene file sample if shareable
- expected routing behavior
- actual output/screenshot
- console model and firmware if known
- whether the bug is parser, UI, export, or documentation related
