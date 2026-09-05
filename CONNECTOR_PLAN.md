# chewmash website ↔ GET connector

The public website is the primary chewmash experience. The browser extension is the optional connector that reads authenticated Cal Poly GET Transaction History without asking the student for credentials.

## Current beta origins

The connector bridge is restricted to:

- `https://the-diegolaredo.github.io/chewmash/*`
- `https://chewmash.app/*`

The second origin is included now so moving to the custom domain later is a deployment change rather than a connector redesign.

## Data flow

```text
chewmash website
      │
      │ window.postMessage (small allowlisted protocol)
      ▼
chewmash website content-script bridge
      │
      │ extension runtime message
      ▼
background service worker ─────► opens/focuses GET Transaction History
                                      │
                                      ▼
                            GET transaction content script
                                      │
                                      ▼
                            chrome.storage.local
                                      │
                                      ▼
website bridge copies only structured dining fields
      │
      ▼
website IndexedDB → React dashboard
```

## Allowed website requests

The page bridge accepts only three request actions:

- `ping` — detect the installed connector/version
- `pull` — copy the latest structured extension dining state into the website
- `sync` — open/focus GET and return the current structured state while the GET content script refreshes it

Storage changes from a completed GET capture are pushed back to the open chewmash website automatically.

## Privacy boundary

The bridge copies only:

- transaction date/time
- normalized and raw dining location
- amount
- transaction source label
- balance snapshots when available
- local sync diagnostics

It does **not** copy or expose:

- Cal Poly username/password
- cookies
- SSO/session tokens
- student IDs/card numbers
- raw GET HTML
- unrelated browser history

The website sanitizes connector data before merging it into its own IndexedDB repository. There is no chewmash dining-data backend.

## Distribution

During beta, users can load the current unpacked Chrome build. Later, the same connector can be distributed through the Chrome Web Store so the website can present a normal `Install connector` flow. PDF import remains available for users who do not install the connector.
