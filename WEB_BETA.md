# chewmash web beta

The public website lives in `apps/web` and is intentionally separate from the working WXT extension.

## What works in the website

- React + TypeScript dashboard
- the existing carousel, daily line/dot chart, day-detail windows, and dining-location chart
- Cal Poly CBORD statement PDF import
- typed budget and transaction logic shared with the extension
- local-only IndexedDB storage
- plan settings, away periods, backups, and clear-data controls
- one-time migration from the original GitHub Pages `chewmash:v1` localStorage value when the new site is deployed on the same origin

The website does not collect Cal Poly credentials and does not upload imported dining history to a chewmash backend.

## Why GET sync is not built directly into the website

A normal website cannot inspect the DOM of a different authenticated website such as `get.cbord.com`. Automatic GET sync therefore remains an optional browser-connector capability. PDF import is the no-install web path.

## Development

```bash
npm install
npm run dev:web
npm run build:web
```

The production web build is written to `apps/web/dist`.

## GitHub Pages beta

`.github/workflows/pages.yml` builds and deploys `apps/web/dist` to GitHub Pages on pushes to `main`. The Vite build uses relative asset paths so the same output works at both the GitHub project URL and a future custom domain.

Expected beta URL after Pages deployment:

```text
https://the-diegolaredo.github.io/chewmash/
```

If the deployment workflow reports that Pages is still configured to deploy from a branch, open **Repository Settings → Pages → Build and deployment**, change **Source** to **GitHub Actions**, then rerun **Deploy web beta** from the Actions tab.

## Moving to chewmash.app later

After purchasing the domain:

1. Open **Repository Settings → Pages**.
2. Enter `chewmash.app` as the custom domain.
3. Add the DNS records requested by GitHub Pages at the domain registrar.
4. Wait for DNS verification and enable **Enforce HTTPS** when GitHub makes the option available.

Do not point the domain at a separate backend unless chewmash intentionally adds server-side features. The current web app is a static site with local browser storage.

## Before sharing broadly

- test PDF import in current Chrome, Safari, Firefox, and Edge
- verify a fresh browser profile starts with no personal dining data
- verify export/import backup round-trips correctly
- upload the correct restaurant SVG assets before treating the dining-location marks as final branding
- update the public privacy text if a backend, analytics, accounts, or cloud sync are ever added
