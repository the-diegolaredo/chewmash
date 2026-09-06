# chewmash

chewmash is a privacy-first Cal Poly Dining Dollars dashboard. The public website at **https://chewmash.app** is the primary product surface, with an optional Manifest V3 browser connector for authenticated GET transaction capture.

The website and connector share the same typed budget, transaction, dining-plan, PDF, storage, and UI logic. Dining history stays local to the user's device; there is no chewmash dining-data backend.

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
- Dining Dollars plan selection, dates, and away periods
- notification/read state and GET sync timestamps
- connector-only capture diagnostics such as capture time and matched row count

chewmash does not store or transmit GET cookies, session tokens, credentials, student IDs, card numbers, or raw GET page HTML.

## Current product structure

The public web app currently has these user-facing areas:

- **Home** — budget summary cards, daily spending chart, spending-by-location chart, and the notification center
- **Upload** — GET connector sync plus local statement PDF import
- **Account** — dining-plan selection, plan dates, away periods, backup controls, privacy controls, and imported transactions
- **Picks** — recommendation code exists in the project, but the page is intentionally not exposed in navigation yet because it is still in development

The floating bottom navigation currently exposes only **Home** and **Upload**. Account is reached from the header. Picks is planned to become the third floating tab once it is ready.

### Home notification center

Home includes a floating bell button. It can surface unread notifications for:

- recent dining purchases
- spending over the current daily target
- GET not having been synced for 24 hours or more

Individual notifications can be dismissed with their close control. While unread notifications exist, the bell uses the red alert gradient; when everything has been read, it returns to the normal chewmash green-to-lime gradient.

## Current architecture

```text
Desktop automatic-sync path

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
shared budget + transaction logic
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
shared budget + transaction logic
        ↓
React dashboard
```

The website bridge is allowlisted for the GitHub Pages origin and `chewmash.app`. It supports connector detection, pulling structured local state, and an explicit user-requested GET sync.

## Repository layout

```text
chewmash/
├── apps/
│   └── web/                           # Vite + React public website
│       └── src/
│           ├── pages/                 # HomePage, UploadPage, AccountPage
│           ├── platform/              # browser-only adapters/actions
│           ├── components/            # web-only reusable components
│           ├── PicksPage.tsx           # Picks UI, not exposed yet
│           └── ...
├── entrypoints/
│   ├── background.ts                  # connector background / GET opener
│   ├── chewmash-web.content.ts        # website ↔ extension local bridge
│   ├── get-history.content.ts         # GET transaction capture
│   └── dashboard/                     # legacy extension dashboard retained during beta
├── src/
│   ├── connector/                     # bridge protocol
│   ├── get/                           # GET parser and sync status
│   ├── lib/                           # budget, dates, transactions, dining plans
│   ├── menu/                          # Dine On Campus + Picks recommendation logic
│   ├── pdf/                           # local CBORD statement parser
│   ├── storage/                       # shared repository + extension/web adapters
│   └── ui/                            # shared React UI helpers and charts
├── CONNECTOR_PLAN.md
├── WEB_BETA.md
├── PRIVACY.md
└── STORE_LISTING.md
```

`App.tsx` is now primarily responsible for loading shared state, navigation, imports, and coordinating pages. Home, Upload, and Account live in their own modules. Browser-specific behavior such as downloads, reloads, browser storage persistence, and confirmation dialogs is isolated under `apps/web/src/platform/` so a future mobile app can provide its own platform adapters without duplicating the core product logic.

The dining-plan catalog also lives in shared core logic rather than being hard-coded into the Account UI.

## Dining plans

Account currently supports the three first-year Dining Dollar plans:

- **First-Year Max** — $3,709 Dining Dollars
- **First-Year Plus** — $3,295 Dining Dollars
- **First-Year Limited** — $2,908 Dining Dollars

The selected plan controls the starting Dining Dollar amount used by the shared budget engine.

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

## Web app

The public website is built from `apps/web` and deployed through GitHub Actions to:

**https://chewmash.app**

Current web features include:

- first-run onboarding
- optional GET connector detection and sync
- automatic copying of a completed GET capture into website IndexedDB
- local CBORD statement import as a fallback
- interactive budget-summary cards grouped in a single summary module
- daily spend dot/line chart with clickable day details
- interactive spending-by-location bar chart with transaction details
- recent-order, over-budget, and stale-sync notifications
- dining-plan selection and away periods
- backup import/export
- local IndexedDB storage
- Home ↔ Upload page transition animation

## GET connector behavior

A normal website cannot inspect another authenticated website's DOM, so automatic desktop GET sync still needs the browser connector.

When the user chooses **Sync GET** on the chewmash website:

1. the website sends an allowlisted local message to the connector bridge;
2. the extension opens or focuses the exact Cal Poly GET Transaction History URL;
3. the student signs into Cal Poly normally if needed;
4. the existing GET content script parses transaction rows into structured dining fields;
5. extension storage changes are pushed back to the open chewmash website;
6. the website sanitizes and merges those fields into IndexedDB.

The connector toolbar action opens the public chewmash website rather than making the extension dashboard the primary experience.

## PDF import

Cal Poly CBORD statement PDFs remain a no-extension fallback. Parsing happens locally in the browser. The parser is intentionally conservative: if a PDF does not look like a supported CBORD statement, chewmash rejects it rather than guessing.

## Budget calculations

The domain layer is separate from the UI and covered by automated tests. In particular:

- **Average spent** = itemized spending ÷ elapsed campus days.
- **Dining Dollars left today** = planned daily target − today's itemized spending.
- **Budget status** = expected spend by now − itemized spending through the same date.
- The starting budget comes from the selected supported dining plan.
- Balance snapshots can still inform remaining-balance planning, but they do not override budget status.
- Missing balance values remain `null` and are never coerced into `$0`.
- Transactions imported from GET and PDFs are deduplicated.
- Away periods are excluded from campus-day calculations.

## Mobile roadmap

The planned mobile app will stay in this same repository and use **Capacitor** rather than starting as a separate rewrite.

The intended structure is:

```text
apps/
├── web/                               # current React + Vite website
└── mobile/                            # planned Capacitor iOS/Android shell

src/                                   # shared chewmash core
├── lib/
├── menu/
├── storage/
├── get/
└── ui/
```

The goal is for web and mobile to share the same budget engine, transaction types, dining plans, Picks logic, parsers, notification rules, and as much UI as practical. Platform-specific behavior will sit behind web/mobile adapters.

The first mobile-specific GET experiment is planned as an in-app browser/WebView proof of concept:

1. the user explicitly taps **Sync GET**;
2. chewmash opens a visible internal GET browser;
3. the user signs into Cal Poly normally;
4. after the allowlisted GET Transaction History page loads, a local parser extracts only the structured dining fields needed by chewmash;
5. those normalized fields are merged into the same shared state model used by the web app.

Whether Cal Poly's authentication flow permits the embedded WebView approach needs to be validated before that path is treated as production-ready.

## Security notes

The desktop connector requests only:

- `storage`
- `tabs`
- host permission to `https://get.cbord.com/calpoly/*`

Its content scripts are restricted to:

- `https://get.cbord.com/calpoly/*`
- `https://the-diegolaredo.github.io/chewmash/*`
- `https://chewmash.app/*`

There is no `<all_urls>` permission, no remote-code execution path, and no backend upload path for dining data. Personal statements, backups, and transaction histories should never be committed to this public repository.

## CI and deployment

Every pull request runs tests, builds the connector/extension, validates the generated manifest, builds the Chrome package, and builds the public web app. Successful runs expose separate extension and web artifacts.

Pushes to `main` also run the GitHub Pages deployment workflow, which builds `apps/web` and publishes the resulting site to `chewmash.app`.
