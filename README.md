# ChewMash

ChewMash is a privacy-first Cal Poly Dining Dollars dashboard. It tracks daily spending pace, remaining balance, spending by location, and budget status while keeping dining data on the user's device.

## Privacy model

ChewMash does **not** ask for or store a Cal Poly username or password. The optional browser extension runs only on the Cal Poly GET domain and this project's GitHub Pages site. It reads structured transaction fields from the authenticated GET Transaction History page after the user signs in normally through Cal Poly.

The extension stores only structured dining data in `chrome.storage.local`:

- transaction date/time
- dining location/activity
- transaction amount
- available balance when visible
- capture timestamp

It does not store or transmit GET cookies, session tokens, credentials, student IDs, or raw page HTML. No backend database is required.

## Repository layout

```text
chewmash/
├── index.html                 # Static dashboard / GitHub Pages app
├── extension/
│   ├── manifest.json          # Manifest V3 permissions
│   ├── get-content.js         # Reads GET transaction history locally
│   └── app-bridge.js          # Local bridge between extension storage and app
├── PRIVACY.md
├── HANDOFF.md
└── .gitignore
```

## Run the dashboard

Open `index.html` directly for PDF-import testing, or enable GitHub Pages for this repository using the repository root on the `main` branch.

The expected Pages URL is:

`https://the-diegolaredo.github.io/chewmash/`

## Install the GET sync extension for development

1. Clone or download this repository.
2. In Chrome or Edge, open the browser's Extensions page.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select the `extension` folder.
6. Open the ChewMash dashboard and choose **Upload → Open GET & sync**.
7. Sign in to Cal Poly GET normally.
8. Visit GET **Transaction History**. The extension captures only the structured dining fields.
9. Return to ChewMash; the dashboard merges the synced purchases and balance locally.

PDF import remains available as a fallback.

## Current limitation

The CBORD GET HTML structure still needs to be verified against the live authenticated Transaction History page. `get-content.js` intentionally uses a conservative table parser and may need selector adjustments after first real-world testing. No credentials are required to make those adjustments; a redacted DOM/table sample is enough.

## Security notes

The extension requests only:

- `storage`
- host access to `https://get.cbord.com/calpoly/*`
- host access to `https://the-diegolaredo.github.io/chewmash/*`

There is no `<all_urls>` permission, no remote code execution, and no backend upload path.
