# ChewMash

ChewMash is a privacy-first Cal Poly Dining Dollars dashboard packaged as a Manifest V3 browser extension. The dashboard, GET transaction capture, budget logic, local PDF import, and local data store now live in one extension.

## Privacy model

ChewMash does **not** ask for or store a Cal Poly username or password. Users sign into Cal Poly GET normally. On the authenticated GET Transaction History page, ChewMash reads only the structured dining fields needed for the dashboard.

Dining state is stored in `chrome.storage.local` / `browser.storage.local` on the user's device. The extension may store:

- transaction date and time
- dining location/activity
- transaction amount
- a balance snapshot only when GET or an imported statement actually provides one
- local capture diagnostics such as capture time and matched row count
- Dining Dollars plan dates, away periods, and starting budget

ChewMash does not store or transmit GET cookies, session tokens, credentials, student IDs, or raw GET page HTML. There is no backend database and no account credentials are collected by ChewMash.

## Current architecture

```text
Cal Poly GET
    ↓
WXT content script
    ↓
Typed local repository
    ↓
chrome.storage.local
    ↓
React dashboard
```

The current extension is built with React, TypeScript, WXT, and Manifest V3.

```text
chewmash/
├── entrypoints/
│   ├── background.ts                 # Opens the full-page dashboard
│   ├── get-history.content.ts        # Reads GET transaction history locally
│   └── dashboard/                    # React extension dashboard
├── src/
│   ├── get/                          # GET parser and sync status
│   ├── lib/                          # Budget, date, and transaction domain logic
│   ├── pdf/                          # Local CBORD statement parser
│   ├── storage/                      # Typed extension storage repository
│   └── ui/                           # React UI helpers and charts
├── extension/                        # Legacy extension kept temporarily for fallback
├── index.html / styles.css / app.js  # Legacy GitHub Pages app kept temporarily
├── PRIVACY.md
└── HANDOFF.md
```

## Development

Requirements: Node.js 22+ and npm.

```bash
npm install
npm test
npm run build
```

WXT writes the unpacked Chrome build to:

```text
.output/chrome-mv3/
```

To run it locally, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `.output/chrome-mv3`.

Clicking the ChewMash toolbar icon opens the full-page React dashboard.

## Easiest beta install

GitHub Actions builds an installable beta automatically. Open the latest successful **CI** run on GitHub, download the `chewmash-chrome-beta` artifact, unzip it, then use Chrome's **Load unpacked** button on that folder.

This removes the need for beta testers to install Node, run npm, or understand the source-code layout. The longer-term distribution path is the Chrome Web Store so normal users receive automatic updates without Developer mode.

## GET sync

From ChewMash, open **Upload → Open GET and sync**. Sign into Cal Poly GET normally. When the Transaction History page loads, the WXT content script parses the table and writes deduplicated structured transactions directly into the same local extension store used by the dashboard.

The GET page often does not display an authoritative account balance. In that case ChewMash stores no GET balance rather than treating a missing value as `$0`. Official statement balance snapshots remain authoritative when imported.

## PDF import

Cal Poly CBORD statement PDFs can be imported from the Upload view. Parsing happens locally in the browser. The parser is intentionally conservative: if a PDF does not look like a supported CBORD statement, ChewMash rejects it rather than guessing.

## Budget calculations

The domain layer is separate from the UI and covered by automated tests. In particular:

- **Average spent** = itemized spending ÷ elapsed campus days.
- Budget pace prefers an official balance snapshot when one exists.
- Missing balance values remain `null` and are never coerced into `$0`.
- Transactions imported from GET and PDFs are deduplicated.
- Away periods are excluded from campus-day calculations.

## Security notes

The WXT extension requests only the permissions needed for the current feature set:

- `storage`
- `tabs`
- host access to `https://get.cbord.com/calpoly/*`

There is no `<all_urls>` permission, no remote code execution path, and no backend upload path. Personal statements, backups, and transaction histories should never be committed to this public repository.

## Legacy code

The old GitHub Pages dashboard and the original `extension/` implementation remain in the repository only as a fallback while the new WXT build is smoke-tested against the live authenticated GET site. They can be removed after the WXT extension has been verified end-to-end in Chrome.
