# chewmash Privacy Policy

chewmash is a privacy-first Cal Poly Dining Dollars dashboard. It is designed so Cal Poly authentication remains between the user, the browser, and Cal Poly/CBORD.

chewmash currently has a public website and an optional browser connector. Neither path requires a chewmash account.

## Data chewmash reads

### Website

Users may choose to import Cal Poly CBORD statement PDFs. PDF parsing happens locally in the browser. The website reads only the structured dining information needed to build the dashboard from those files.

When the optional chewmash connector is installed, the website can also receive structured dining data from that extension on the same device. The connector does not give the website Cal Poly credentials, authentication cookies, session tokens, or raw GET HTML.

The Picks feature may request public Cal Poly menu metadata from Dine On Campus, including menu item names, dining locations, meal periods, nutrition, portions, dietary tags, and prices when Dine On Campus publishes them. chewmash does not send a user's private GET transactions, Dining Dollars balance, Cal Poly credentials, or identifiers to Dine On Campus as part of this menu request.

### Browser connector

When the user opens the authenticated Cal Poly GET Transaction History page, the chewmash connector may read only the structured dining information needed for the dashboard:

- transaction date and time
- dining location / activity
- transaction amount
- visible Dining Dollars balance, when the page actually provides one

The connector also runs a small bridge only on the chewmash website so the user can detect the connector, open GET, copy structured dining data from extension-local storage into the website's local IndexedDB, and request public Dine On Campus menu data for Picks when the website's direct public-menu request is unavailable.

## Data chewmash stores

### Website

The public web app stores its application state locally in browser IndexedDB on the user's device. Stored data may include:

- structured dining transactions
- balance snapshots
- Dining Dollars plan dates and starting budget
- away / break periods used for budget calculations

The website may cache public Dine On Campus menu results locally in browser storage for a short period so the Picks page does not have to repeatedly download the same menu.

The website may also copy the original GitHub Pages prototype's `chewmash:v1` localStorage state into the new typed IndexedDB repository when both versions run on the same origin. The old value is not deleted by that migration.

### Browser connector

The connector stores its application data locally in extension storage (`chrome.storage.local` / `browser.storage.local`). It may additionally store local GET capture diagnostics such as capture time, row count, and number of matched transactions.

The current chewmash web beta and connector do not require a backend database for dining history.

## Data chewmash does not intentionally collect or store

chewmash does not intentionally collect or store:

- Cal Poly usernames or passwords
- authentication cookies
- SSO or session tokens
- student IDs or card numbers
- raw GET page HTML
- general browser history
- browsing activity outside the explicitly permitted Cal Poly GET and chewmash website pages used by the connector

chewmash does not sell dining data, use dining data for advertising, or transmit dining transaction history to GitHub or Dine On Campus.

## Network and extension permissions

The public web app is delivered as static application files. Imported statement contents and the resulting structured dining history are processed and stored locally in the browser. The Picks page may make network requests for public menu metadata from Dine On Campus.

The optional browser connector requests narrow host permissions for:

- `https://get.cbord.com/calpoly/*`
- `https://apiv4.dineoncampus.com/*`

The GET permission is used to read the authenticated GET Transaction History page after the user signs in normally. The Dine On Campus permission is used only to request public Cal Poly menu and nutrition metadata for Picks when the website needs the connector as a browser-network fallback. The connector does not send private GET data to Dine On Campus.

The connector also requests storage and tab permissions used to save data locally and open or refresh the GET transaction-history tab when the user chooses to sync.

The connector content scripts are restricted to the Cal Poly GET pages above plus the chewmash website origins used for the local page-to-extension bridge:

- `https://the-diegolaredo.github.io/chewmash/*`
- `https://chewmash.app/*`

No content script runs on Dine On Campus. Public menu data is requested by the extension background process only. The chewmash website bridge accepts only a small allowlisted message protocol for connector detection, local-state copying, opening GET, and dated public-menu requests. There is no `<all_urls>` permission and no remote-code execution path.

## Data control

Users can clear imported dining data from the chewmash dashboard. They can also export a local JSON backup and later import it on their own device or browser.

Clearing browser site data can remove the website's IndexedDB data and cached menu data. Removing the extension may remove extension-local data according to the browser's extension-storage behavior. Exporting a backup is the recommended way to keep a portable copy.

## Public repository warning

chewmash source code is public, but user dining data is not part of the repository. Do not commit exported statements, JSON backups, screenshots containing account details, or hard-coded personal transaction histories to the public repository.

## Contact and changes

The source repository is the primary project contact and change log:

`https://github.com/the-diegolaredo/chewmash`

Material changes to this privacy policy should be committed alongside the corresponding product changes.
