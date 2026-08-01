# RouteView architecture

## Runtime boundary

RouteView is a static, client-side Vite application deployed as its own Vercel
project. The browser reads and parses scene content locally. There is no RouteView
application server, account system, cloud scene storage, reverse proxy, iframe, or
portfolio runtime dependency.

```text
X32/M32 .scn file
        │
        ▼
Upload validation + browser FileReader
        │
        ▼
Conservative scene parser
        │
        ▼
Typed scene model + topology helpers
        │
        ├── Volunteer-facing production sheet
        ├── Routing summaries and signal views
        └── Markdown / HTML / JSON / text / CSV / print-PDF exports
```

## Source layout

- `src/pages/` — top-level application views
- `src/components/` — upload, documentation, routing, export, and UI components
- `src/parsers/` — X32/M32 scene parsing
- `src/lib/` — scene modeling, validation, topology, exports, and public-site config
- `src/types/` — routing and scene domain types
- `src/test/` — parser, model, topology, upload, export, routing, and metadata tests
- `public/` — static icons and assets copied by Vite

## Public origin configuration

`VITE_SITE_URL` is normalized through `src/lib/siteConfig.ts`. Vite uses the same
configuration to render canonical metadata and emit `robots.txt` and `sitemap.xml`.
The production fallback is `https://routeview.mell0wx.tech`; local development uses
`http://localhost:8080` unless explicitly overridden.

## Trust boundaries

- scene text is treated as untrusted data and never executed
- files above the configured size limit are rejected before parsing
- unsupported commands remain visible instead of being silently guessed
- HTML export escapes scene-derived content
- public URL configuration contains no credentials

See [deployment.md](deployment.md) for hosting and rollback procedures and
[roadmap.md](roadmap.md) for implemented-versus-future scope.
