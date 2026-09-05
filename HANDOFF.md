# ChewMash Development Handoff

## Product goal

Build a minimal Cal Poly Dining Dollars app that helps a student stay within a semester dining budget while preserving privacy.

## Current UX

- Green-accented, Student Center-inspired dashboard.
- Floating bottom tab bar with **Home** and **Upload**.
- Home contains:
  - carousel metric for average spent
  - amount spent on the current/as-of day
  - under / over / on-budget status
  - daily spending dot chart
  - spending-by-place vertical bar chart
- Account button opens:
  - remaining balance
  - plan settings
  - arrival and end dates
  - away periods
  - imported transactions
  - data export/import controls
- Upload includes:
  - local PDF importer for monthly CBORD GET statements
  - GET sync entry point

## Budget assumptions currently encoded

- Starting Dining Dollars default: `$3,295`
- Fall 2026 semester window default: `2026-08-19` through `2026-12-18`
- Thanksgiving/Fall Break default excluded: `2026-11-23` through `2026-11-29`
- Users can change these values from Account settings.

## Privacy/security requirements

Do not weaken these without explicit approval:

1. Never ask for, collect, or store Cal Poly credentials.
2. Cal Poly SSO/login is performed directly on Cal Poly/CBORD pages.
3. Manifest V3 extension permissions must remain narrowly scoped.
4. Do not use `<all_urls>`.
5. Do not copy GET cookies or session tokens.
6. Do not upload raw GET HTML to a server.
7. Keep dining transaction data local by default.
8. PDF upload must remain as a fallback.
9. Do not commit personal dining transaction data into this public repository.

## GET extension architecture

`extension/get-content.js`
- Runs only on the Cal Poly GET host.
- Exits immediately unless the path is `/calpoly/full/history.php`.
- Parses transaction table rows conservatively.
- Stores structured data only in `chrome.storage.local`.

`extension/app-bridge.js`
- Runs only on `https://the-diegolaredo.github.io/chewmash/*`.
- Reads the extension's local structured data.
- Bridges it to the dashboard with same-origin `window.postMessage` events.
- No hard-coded extension ID is required.

`index.html`
- Opens GET in a new tab on user action.
- Requests cached extension data when the extension is present.
- Merges synced data with locally imported PDF data using transaction deduplication.

## Next test

The first real test should verify the authenticated GET Transaction History DOM. If the parser misses rows, adjust only the table extraction logic in `get-content.js`. A redacted HTML/table sample is sufficient; credentials are not needed.
