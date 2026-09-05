# chewmash

chewmash is a privacy-first Cal Poly Dining Dollars dashboard. The project now has two delivery surfaces that share the same typed budget, transaction, PDF, and UI code:

- a **public React web app** for no-install PDF import and local budgeting
- a **Manifest V3 browser extension** for authenticated GET transaction capture

The extension remains working while the website is introduced, so the web migration does not remove the existing beta.

## Privacy model

chewmash does **not** ask for or store a Cal Poly username or password.

The web app parses imported CBORD statement PDFs locally and stores structured dining state in browser IndexedDB. The extension reads only the structured dining fields needed from the authenticated GET Transaction History page and stores them in extension-local storage.

Depending on the surface, chewmash may store locally:

- transaction date and time
- dining location/activity
- transaction amount
- a balance snapshot only when GET or an imported statement actually provides one
- Dining Dollars plan dates, away periods, and starting budget
- extension-only capture diagnostics such as capture time and matched row count

chewmash does not store or transmit GET cookies, session tokens, credentials, student IDs, or raw GET page HTML. The current web beta has no dining-data backend.

## Current architecture

```text
No-install web path

CBORD statement PDF
        ↓
local PDF parser
        ↓
typed repository
        ↓
IndexedDB
        ↓
React dashboard

Optional automatic-sync path

Cal Poly GET
        ↓
WXT content script
        ↓
typed repository
        ↓
chrome.storage.local
        ↓
React extension dashboard
```

## Repository layout

```text
chewmash/
├── apps/
│   └── web/                           # Vite + React public website
├── entrypoints/
│   ├── background.ts                  # WXT extension background
│   ├── get-history.content.ts         # GET transaction capture
│   └── dashboard/                     # React extension dashboard
├── src/
│   ├── get/                           # GET parser and sync status
│   ├── lib/                           # Budget, date, and transaction domain logic
│   ├── pdf/                           # Local CBORD statement parser
│   ├── storage/                       # Shared repository + extension/web adapters
│   └── ui/                            # Shared React UI helpers and charts
├── extension/                         # Legacy extension fallback
├── index.html / styles.css / app.js   # Legacy Pages prototype kept temporarily
├── WEB_BETA.md
├── PRIVACY.md
└── HANDOFF.md
```

## Development

Requirements: Node.js 22+ and npm.

```bash
npm install
npm test
npm run build       # WXT extension
npm run build:web   # public website
```

Run development servers with:

```bash
npm run dev
npm run dev:web
```

WXT writes the unpacked Chrome build to `.output/chrome-mv3/`. Vite writes the website build to `apps/web/dist/`.

## Web beta

The public website is built from `apps/web`. It supports:

- first-run onboarding
- local CBORD statement import
- the three-card carousel
- daily spend line/dot chart with clickable day details
- spending by dining location
- plan settings and away periods
- backup import/export
- local IndexedDB storage

When deployed over the same GitHub Pages origin as the original prototype, the web app can copy the old `chewmash:v1` localStorage state into the new typed IndexedDB repository once. It does not delete the old value.

GitHub Actions contains a Pages deployment workflow for the web beta. See `WEB_BETA.md` for the deployment and future custom-domain steps.

## Why automatic GET sync still needs a connector

A normal website cannot inspect a different authenticated website's DOM. For that reason, the public website cannot directly scrape the user's signed-in GET tab.

The current extension provides the authenticated capture path without collecting Cal Poly credentials. Long term, that extension can become a small optional connector while the website remains the primary user experience.

## PDF import

Cal Poly CBORD statement PDFs can be imported in both the website and extension. Parsing happens locally in the browser. The parser is intentionally conservative: if a PDF does not look like a supported CBORD statement, chewmash rejects it rather than guessing.

## Budget calculations

The domain layer is separate from the UI and covered by automated tests. In particular:

- **Average spent** = itemized spending ÷ elapsed campus days.
- **Dining Dollars left today** = planned daily target − today's itemized spending.
- Budget pace prefers an official balance snapshot when one exists.
- Missing balance values remain `null` and are never coerced into `$0`.
- Transactions imported from GET and PDFs are deduplicated.
- Away periods are excluded from campus-day calculations.

## Security notes

The extension requests only:

- `storage`
- `tabs`
- host access to `https://get.cbord.com/calpoly/*`

There is no `<all_urls>` permission, no remote-code execution path, and no backend upload path for dining data. Personal statements, backups, and transaction histories should never be committed to this public repository.

## CI

Every pull request runs tests, builds the extension, validates the generated manifest, builds the Chrome package, and builds the public web app. Successful runs expose separate extension and web artifacts.
