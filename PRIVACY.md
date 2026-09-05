# ChewMash Privacy Policy

ChewMash is a privacy-first Cal Poly Dining Dollars dashboard. It is designed so Cal Poly authentication remains between the user, the browser, and Cal Poly/CBORD.

## Data ChewMash reads

When the user opens the authenticated Cal Poly GET Transaction History page, the ChewMash extension may read only the structured dining information needed for the dashboard:

- transaction date and time
- dining location / activity
- transaction amount
- visible Dining Dollars balance, when the page actually provides one

Users may also choose to import Cal Poly CBORD statement PDFs. PDF parsing happens locally in the browser.

## Data ChewMash stores

ChewMash stores its application data locally in the browser's extension storage (`chrome.storage.local` / `browser.storage.local`). Stored data may include:

- structured dining transactions
- balance snapshots
- Dining Dollars plan dates and starting budget
- away / break periods used for budget calculations
- local GET capture diagnostics such as capture time, row count, and number of matched transactions

The extension does not require a ChewMash account or backend database.

## Data ChewMash does not intentionally collect or store

ChewMash does not intentionally collect or store:

- Cal Poly usernames or passwords
- authentication cookies
- SSO or session tokens
- student IDs or card numbers
- raw GET page HTML
- general browser history
- browsing activity outside the explicitly permitted Cal Poly GET pages

ChewMash does not sell dining data, use dining data for advertising, or transmit dining transaction history to GitHub.

## Network and permissions

ChewMash requests host access only to:

`https://get.cbord.com/calpoly/*`

This permission is used to read the authenticated GET Transaction History page after the user signs in normally. ChewMash also requests extension storage and tab permissions used to save data locally and open or refresh the GET transaction-history tab from the dashboard.

There is no `<all_urls>` permission and no remote-code execution path.

## Data control

Users can clear imported dining data from the ChewMash dashboard. They can also export a local JSON backup and later import it on their own device.

Removing the extension through the browser may also remove extension-local data according to the browser's extension-storage behavior.

## Public repository warning

ChewMash source code is public, but user dining data is not part of the repository. Do not commit exported statements, JSON backups, screenshots containing account details, or hard-coded personal transaction histories to the public repository.

## Contact and changes

The source repository is the primary project contact and change log:

`https://github.com/the-diegolaredo/chewmash`

Material changes to this privacy policy should be committed alongside the corresponding product changes.
