# Production Runbook

## Deployment checklist

- [ ] Confirm the release commit is reviewed and `main` is protected.
- [ ] Run `npm ci`, `npm run lint`, `npm test`, and `npm run build` from a clean checkout.
- [ ] Confirm the dependency audit and GitHub security alerts have no unresolved critical/high findings.
- [ ] Test demo, valid scene, invalid extension, empty scene, malformed scene, replacement upload, search, every advanced tab, every export, and print/PDF.
- [ ] Check keyboard-only operation, visible focus, 200% zoom, narrow mobile viewport, and light/dark OS preference.
- [ ] Verify `x32-m32-routeview.vercel.app`, HTTPS, redirects, SPA fallback, favicon, canonical URL, Open Graph image, robots file, and 404 behavior.
- [ ] Confirm browser console/network panels contain no errors and no scene payload leaves the browser.
- [ ] Tag `v1.0.0`, publish the GitHub release notes, and record the deployed commit SHA.

## Rollback checklist

- [ ] Record the incident time, deployed SHA, browser, input type, and observed impact without collecting private scene content.
- [ ] Disable promotion or roll the hosting alias back to the last accepted deployment.
- [ ] Re-run the demo and a sanitized regression scene against the restored version.
- [ ] Confirm DNS/HTTPS and static assets resolve after rollback.
- [ ] Open a focused issue with severity, reproduction, and owner; do not upload sensitive scenes.
- [ ] Communicate the rollback and known-safe version in the release and project channels.

## Post-launch monitoring checklist

- [ ] Check deployment errors, Core Web Vitals, 404s, and asset failures daily for the first week.
- [ ] Review GitHub issues for parser false positives, export failures, accessibility blockers, and confusing volunteer language.
- [ ] Review dependency and CodeQL alerts at least weekly.
- [ ] Reproduce reports with sanitized minimum fixtures and add regression tests before fixes.
- [ ] Track unsupported categories by console model and firmware; prioritize frequency and routing risk.
- [ ] Review usage analytics only if privacy-preserving analytics are deliberately added and disclosed.

## Release acceptance

The release is accepted when production serves the intended commit, all checklist
flows pass, no scene data is transmitted, no P0/P1 defect is open, and rollback has
been verified or is available as a one-action hosting promotion.
