# ChewMash Beta Smoke Test

Use the latest successful `chewmash-chrome-beta` artifact from GitHub Actions.

## Install

1. Download and unzip the beta artifact.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Remove or disable the old ChewMash GET Sync extension to avoid duplicate capture behavior.
5. Choose **Load unpacked** and select the unzipped beta folder.
6. Click the ChewMash toolbar icon. The full-page dashboard should open.

## Home

- The dashboard opens without a GitHub Pages tab.
- Average spent is a realistic itemized-spend average, not based on a missing `$0` balance.
- Remaining balance falls back safely when no official balance snapshot exists.
- Daily spending and dining-location charts render after transactions are present.
- The floating navigation contains only Home and Upload.
- Account opens from the top-right button.

## GET sync

1. In ChewMash, open Upload and choose the GET sync action.
2. Sign into Cal Poly GET normally if needed.
3. Visit Transaction History.
4. Return to ChewMash.

Expected:

- transactions appear without manually pressing the old Capture popup button
- duplicate visits do not duplicate transactions
- amounts formatted like `- $13.07` are recognized
- a missing GET balance does not create a `$0` balance snapshot
- no ChewMash credentials prompt appears

## PDF import

- Import a known Cal Poly CBORD statement PDF.
- Transactions merge without duplicating matching GET transactions.
- An ending balance from the statement becomes an official balance snapshot.
- Unsupported PDFs fail with a clear error instead of guessing.

## Account and data controls

- Update plan dates / starting budget / away periods and confirm Home recalculates.
- Export a JSON backup.
- Clear dining data and confirm plan settings remain.
- Re-import the backup and confirm the local data is restored.

## Privacy check

Open the extension details page in Chrome and confirm:

- host access is limited to `get.cbord.com/calpoly`
- there is no `<all_urls>` access
- no separate GitHub Pages host permission is requested

## Pass criteria

The WXT extension can replace the legacy GitHub Pages + old extension flow once the Home, GET sync, PDF import, Account, backup, and privacy checks above pass on a real authenticated GET session.
