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

## Reporting missing or unsupported scene parameters

RouteView is intentionally conservative. If the app shows a scene command, routing value, or console parameter as **unknown**, **unsupported**, or **not fully explained**, please open an issue so support can be improved.

This is especially helpful for:
- older X32 firmware versions
- M32, M32R, and M32C scenes
- X32 Producer, Compact, Rack, and Core scenes
- uncommon routing configurations
- AES50, Ultranet, matrix, and output patching differences
- scene files created in X32-Edit or M32-Edit

### What to include

Please include as much of the following as possible:

```text
Console model:
Firmware version:
Software used to export scene:
Scene source: console / X32-Edit / M32-Edit
RouteView version or commit:
Parameter shown as missing/unknown:
What you expected it to mean:
Screenshot of the RouteView warning:
Relevant .scn lines if safe to share:
```

### Public safety

Do **not** share sensitive information such as:
- church names
- private network details
- Wi-Fi passwords
- internal IP addresses
- personal names
- private service notes
- livestream keys
- credentials or tokens

If your `.scn` file contains sensitive names, rename channels or redact the file before sharing.

### Helpful issue title format

```text
Unsupported parameter: [parameter name] on [console model] firmware [version]
```

Example:

```text
Unsupported parameter: /config/routing/AES50 on M32R firmware 4.06
```

### Why this matters

RouteView improves by learning from real-world scene files. Different firmware versions and console models may include routing or scene parameters that are not available in the examples currently used for development.

Reports like this help improve parser coverage without guessing.
