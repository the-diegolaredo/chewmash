# ChewMash Privacy Notes

ChewMash is designed so the user's Cal Poly authentication remains between the user, the browser, and Cal Poly/CBORD.

## What ChewMash reads

When the optional extension is installed and the user is viewing Cal Poly GET Transaction History, it may read:

- transaction date and time
- activity / dining location
- transaction amount
- visible Dining Dollars balance

## What ChewMash does not read or store intentionally

- Cal Poly password
- Cal Poly username
- authentication cookies
- SSO tokens
- browser history outside the two explicitly allowed hosts
- raw GET page HTML
- student ID or card number

## Where data is stored

The dashboard stores imported data in the browser's `localStorage`. The extension stores the latest structured GET capture in `chrome.storage.local` so it can be passed to the dashboard on the same device.

No application backend is required for the current design, and dining transaction data is not uploaded to GitHub.

## Public repository warning

Do not commit exported statements, JSON backups, screenshots containing account details, or hard-coded transaction histories to this repository. GitHub source code is not a private data store.
