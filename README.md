# chewmash

chewmash is a privacy-first Cal Poly Dining Dollars dashboard. The public website is now the primary product surface, with an optional Manifest V3 browser connector for authenticated GET transaction capture.

The website and connector share the same typed budget, transaction, PDF, storage, and UI logic. Dining history stays local to the user's browser; there is no chewmash dining-data backend.

## Privacy model

chewmash does **not** ask for or store a Cal Poly username or password.

The web app stores structured dining state in browser IndexedDB. It can receive that data in two local-only ways:

- parse a supported Cal Poly CBORD statement PDF directly in the browser
- receive already-parsed GET dining fields from the optional chewmash connector on the same device

The connector reads only the structured dining fields needed from the authenticated GET Transaction History page after the student signs in normally.

Depending on the surface, chewmash may store locally:

- transaction date and time
- dining location/activity
- transaction amount
- a balance snapshot only when GET or an imported statement actually provides one
- Dining Dollars plan dates, away periods, and starting budget
- connector-only capture diagnostics such as capture time and matched row count

chewmash does not store or transmit GET cookies, session tokens, credentials, student IDs, card numbers, or raw GET page HTML.

## Current architecture

```text
Recommended automatic-sync path

chewmash website
        │
        │ local allowlisted page bridge
        ▼
chewmash connector extension
        │
        ▼
Cal Poly GET Transaction History
        │
        ▼
parsed structured dining fields
        │
        ▼
extension-local storage
        │
        ▼
website IndexedDB
        │
        ▼
React dashboard

No-extension fallback

CBORD statement PDF
        ↓
local PDF parser
        ↓
website IndexedDB
        ↓
React dashboard
```

The website bridge currently runs only on the GitHub Pages beta origin and the future `chewmash.app` origin. It supports three small actions: connector detection, pulling structured local state, and an explicit user-requested GET sync.

## Repository layout

```text
chewmash/
├── apps/
│   └── web/                           # Vite + React public website
├── entrypoints/
│   ├── background.ts                  # connector background / GET opener
│   ├── chewmash-web.content.ts        # website ↔ extension local bridge
│   ├── get-history.content.ts         # GET transaction capture
│   └── dashboard/                     # legacy/full extension dashboard retained during beta
├── src/
│   ├── connector/                     # bridge protocol
│   ├── get/                           # GET parser and sync status
│   ├── lib/                           # Budget, date, and transaction domain logic
│   ├── pdf/                           # Local CBORD statement parser
│   ├── storage/                       # Shared repository + extension/web adapters
│   └── ui/                            # Shared React UI helpers and charts
├── CONNECTOR_PLAN.md
├── WEB_BETA.md
├── PRIVACY.md
└── STORE_LISTING.md
```

## Development

Requirements: Node.js 22+ and npm.

```bash
npm install
npm test
npm run build       # WXT connector/extension
npm run build:web   # public website
```

Run development servers with:

```bash
npm run dev
npm run dev:web
```

WXT writes the unpacked Chrome build to `.output/chrome-mv3/`. Vite writes the website build to `apps/web/dist/`.

## Web beta

The public website is built from `apps/web` and deployed by GitHub Actions. It supports:

- first-run onboarding
- optional GET connector detection and sync
- automatic copying of a completed GET capture into website IndexedDB
- local CBORD statement import as a fallback
- the three-card carousel
- daily spend line/dot chart with clickable day details
- spending by dining location
- plan settings and away periods
- backup import/export
- local IndexedDB storage

The current beta lives at:

`https://the-diegolaredo.github.io/chewmash/`

The connector already includes `https://chewmash.app/*` in its narrow website allowlist so moving to the custom domain later does not require redesigning the bridge.

## GET connector behavior

A normal website cannot inspect another authenticated website's DOM, so automatic GET sync still needs the browser connector.

When the user chooses **Sync GET** on the chewmash website:

1. the website sends an allowlisted local message to the connector bridge;
2. the extension opens or focuses the exact Cal Poly GET Transaction History URL;
3. the student signs into Cal Poly normally if needed;
4. the existing GET content script parses transaction rows into structured dining fields;
5. extension storage changes are pushed back to the open chewmash website;
6. the website sanitizes and merges those fields into IndexedDB.

The connector toolbar action now opens the public chewmash website rather than making the extension dashboard the primary experience.

## PDF import

Cal Poly CBORD statement PDFs remain a no-extension fallback. Parsing happens locally in the browser. The parser is intentionally conservative: if a PDF does not look like a supported CBORD statement, chewmash rejects it rather than guessing.

## Budget calculations

The domain layer is separate from the UI and covered by automated tests. In particular:

- **Average spent** = itemized spending ÷ elapsed campus days.
- **Dining Dollars left today** = planned daily target − today's itemized spending.
- **Budget status** = expected spend by now − itemized spending through the same date.
- Balance snapshots can still inform remaining-balance planning, but they do not override budget status.
- Missing balance values remain `null` and are never coerced into `$0`.
- Transactions imported from GET and PDFs are deduplicated.
- Away periods are excluded from campus-day calculations.

## Security notes

The connector requests only:

- `storage`
- `tabs`
- host permission to `https://get.cbord.com/calpoly/*`

Its content scripts are restricted to:

- `https://get.cbord.com/calpoly/*`
- `https://the-diegolaredo.github.io/chewmash/*`
- `https://chewmash.app/*`

There is no `<all_urls>` permission, no remote-code execution path, and no backend upload path for dining data. Personal statements, backups, and transaction histories should never be committed to this public repository.

## CI

Every pull request runs tests, builds the connector/extension, validates the generated manifest, builds the Chrome package, and builds the public web app. Successful runs expose separate extension and web artifacts.
