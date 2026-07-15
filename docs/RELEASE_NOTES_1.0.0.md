# RouteView 1.0.0

RouteView turns Behringer X32 and Midas M32 `.scn` files into a searchable,
volunteer-friendly routing guide without uploading scene data.

## Highlights

- drag, browse, or demo import flow with plain-language validation
- normalized inputs, buses, DCAs, outputs, routing blocks, and signal views
- conservative warnings and parser buckets for content RouteView cannot yet explain
- production sheet with search, jump links, collapsible sections, and print layout
- Markdown, HTML, JSON, text, CSV, and browser PDF exports
- CI, CodeQL, Dependabot, contributor templates, and release runbooks

## Compatibility

Supported: text `.scn` scenes from the Behringer X32 and Midas M32 families.
See [LAUNCH_READINESS.md](LAUNCH_READINESS.md#known-limitations) before relying on
the output for a production change.

## Upgrade notes

This is the first public release. No migration is required and no scene content is
stored. Clear the browser cache or hard-refresh if a deployment still shows an older
static bundle.

## Verification

At release audit time: 17 tests passed, ESLint passed, the production build completed,
and the production dependency audit reported zero known vulnerabilities.
