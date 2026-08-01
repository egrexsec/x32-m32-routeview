# RouteView

RouteView turns **Behringer X32** and **Midas M32** scene (`.scn`) files into readable routing documentation and production handoff guides.

**Production URL:** <https://routeview.mell0wx.tech>

**Source:** <https://github.com/egrexsec/x32-m32-routeview>

**Status:** v1.0.0 is released; the branded Vercel custom-domain cutover requires the owner steps in [docs/deployment.md](docs/deployment.md).

![RouteView production sheet](docs/assets/screenshots/routeview-production-sheet.png)

## Why RouteView exists

An X32/M32 scene file is useful to the console but difficult to use as an operating document. Routing decisions, monitor mixes, outputs, DCAs, and unsupported commands are buried in a text export. RouteView gives volunteers, engineers, and replacement operators a faster way to inspect that information without loading the scene on a console.

Scene content stays in the browser. RouteView does not connect to a console, upload scene data, or modify the source file.

## Implemented features

- drag-and-drop, file-picker, replacement, cancellation, and demo-data workflows
- local X32/M32 `.scn` parsing with file type, empty-file, and size validation
- normalized channels, buses, DCAs, outputs, routing blocks, and topology helpers
- volunteer-facing production sheet with search, jump links, collapsible sections, highlights, reset, and no-results feedback
- routing summaries, signal-flow views, graph views, warnings, and parser bucket summaries
- conservative handling that surfaces unsupported or partially parsed commands instead of guessing
- Markdown, HTML, JSON, plain-text, CSV, and browser print/PDF exports
- clean scene/date-based export filenames
- responsive upload and documentation workflow with visible processing and error states

## Screenshots

| Upload workflow | Generated documentation |
| --- | --- |
| ![RouteView upload](docs/assets/screenshots/home.png) | ![RouteView generated documentation](docs/assets/screenshots/generated-docs.png) |

Additional screenshots:

- [upload success](docs/assets/screenshots/upload-success.png)
- [export menu](docs/assets/screenshots/export-menu.png)
- [production sheet](docs/assets/screenshots/routeview-production-sheet.png)

## Technology

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 3
- Radix UI primitives
- Vitest
- ESLint
- Vercel static deployment

See [docs/architecture.md](docs/architecture.md) for runtime boundaries and source layout.

## Local development

Use the package manager indicated by `package-lock.json`:

```bash
npm ci
npm run dev
```

Open <http://localhost:8080>.

### Environment variables

Copy `.env.example` only when you need to override public-origin behavior:

```bash
cp .env.example .env.local
```

| Variable | Purpose | Local default | Production value |
| --- | --- | --- | --- |
| `VITE_SITE_URL` | Canonical metadata, sitemap, and robots origin | `http://localhost:8080` | `https://routeview.mell0wx.tech` |

`VITE_` values are browser-visible public configuration. Never place secrets or credentials in them.

## Validation

```bash
npm ci
npm run lint
npx tsc -b
npm run test
npm run build
```

`npx tsc -b` performs TypeScript project compilation. `npm run build` then emits the production Vite bundle.

Automated coverage includes parser, scene model, topology graph, upload validation, exporters, route handling, and public metadata configuration.

## Deployment

RouteView remains an independent Vercel project. It is not deployed through, proxied by, embedded in, or merged into the `mell0wx.tech` portfolio runtime.

The production Vercel project should set:

```text
VITE_SITE_URL=https://routeview.mell0wx.tech
```

Follow [docs/deployment.md](docs/deployment.md) for the exact Vercel domain, DNS, SSL, verification, and rollback steps. Keep the generated `*.vercel.app` URL for previews and troubleshooting rather than redirecting it in application code.

## Project structure

```text
src/
  components/   upload, documentation, routing, and export UI
  lib/          validation, modeling, topology, exporters, and site config
  pages/        top-level application views
  parsers/      X32/M32 scene parsing
  test/         Vitest suites
  types/        routing domain types
docs/           architecture, deployment, roadmap, release, and screenshots
public/         static assets
```

## Roadmap

[docs/roadmap.md](docs/roadmap.md) distinguishes shipped v1.0.0 behavior from near-term candidates and future ideas. Major unreleased ideas include scene comparison, richer routing-map layers, and additional console adapters.

## Contributing and security

- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Issue tracker](https://github.com/egrexsec/x32-m32-routeview/issues)
- [v1.0.0 release](https://github.com/egrexsec/x32-m32-routeview/releases/tag/v1.0.0)

Do not attach private production scene files to public issues. Reduce parser reports to sanitized minimum fixtures.

## License

RouteView is available under the [MIT License](LICENSE).
