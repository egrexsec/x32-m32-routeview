# RouteView deployment

RouteView is an independently deployable Vite application. The portfolio at
`mell0wx.tech` links to RouteView; it does not proxy, embed, or host the app runtime.

## Vercel assumptions

- Repository: `egrexsec/x32-m32-routeview`
- Framework preset: Vite
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: the repository default branch
- SPA fallback: supplied by `vercel.json`
- Generated Vercel domains remain available for previews and troubleshooting

## Production environment

Set this variable for the Production environment in Vercel:

```text
VITE_SITE_URL=https://routeview.mell0wx.tech
```

The value is public configuration, not a secret. Preview deployments should retain
their generated Vercel URLs; do not add application code that redirects previews or
localhost. Production builds default to the branded origin if the variable is absent,
while local development defaults to `http://localhost:8080`.

## Add the custom domain

1. Open the RouteView project in Vercel.
2. Go to **Settings → Domains**.
3. Add `routeview.mell0wx.tech`.
4. Copy the DNS record Vercel provides.
5. In the DNS provider managing `mell0wx.tech`, add that exact record. Do not assume
   a CNAME target; use Vercel's displayed type, name, and value.
6. Wait for Vercel to verify the domain.
7. Confirm Vercel reports an active SSL certificate.
8. Configure the branded hostname as the intended production domain in Vercel.
9. Redeploy Production after setting `VITE_SITE_URL`.

Vercel's generated `*.vercel.app` hostname should be retained for previews and
troubleshooting. Setting the branded hostname as primary in Vercel is preferred over
an application redirect because it avoids breaking preview deployments.

## Verification

```bash
npm ci
npm run lint
npm run test
npm run build
curl -I https://routeview.mell0wx.tech
```

Then verify:

- `/` returns the intended production deployment
- `/robots.txt` and `/sitemap.xml` return `200`
- page canonical, Open Graph URL, and JSON-LD use the branded origin
- SSL is valid and the certificate covers `routeview.mell0wx.tech`
- upload, demo, replacement upload, export, print/PDF, and unknown-route behavior
- no scene payload leaves the browser
- desktop and narrow mobile layouts remain usable

## Rollback

1. Record the failing deployment and commit SHA without collecting private scenes.
2. In Vercel, promote the last accepted deployment or roll back the production alias.
3. Re-run the demo and a sanitized regression scene.
4. Recheck DNS, HTTPS, canonical metadata, static assets, and SPA fallback.
5. Open a focused issue with sanitized reproduction details.

DNS changes are not required for a normal application rollback when the custom domain
remains attached to the same Vercel project.
