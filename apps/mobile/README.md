# ChewMash mobile

This directory contains the native Capacitor iOS app for ChewMash. It reuses the React/Vite UI and shared budgeting/storage logic from the web app, while switching to native-aware onboarding and GET syncing when the bundle is running inside Capacitor.

The Capacitor app identity is:

- app name: `ChewMash`
- bundle/app id: `app.chewmash`
- bundled web assets: `apps/web/dist`
- minimum iOS version: 15

## Native mobile behavior

The iOS build does **not** use the Chrome connector or connector ZIP. The mobile setup and Upload screens instead expose a native **Connect GET** action:

1. ChewMash presents a temporary in-app `WKWebView` at GET Transaction History.
2. The student completes Cal Poly / Duo / GET authentication normally.
3. ChewMash does not inspect authentication pages.
4. Only after the exact URL `https://get.cbord.com/calpoly/full/history.php` finishes loading does the app run the local `src/get/mobile-capture.js` parser.
5. The parser returns sanitized dining fields (`date`, `time`, `rawLocation`, normalized `location`, `amount`) and an optional visible balance.
6. Those fields are merged into the same local ChewMash repository used by the dashboard.
7. The temporary browser dismisses after a successful capture.

The native browser currently uses `WKWebsiteDataStore.nonPersistent()`. That intentionally keeps login cookies and session state out of ChewMash storage and can require a fresh sign-in for each sync.

## Privacy boundary

ChewMash never injects its parser into Cal Poly login, Duo, or unrelated pages. The native URL gate requires all three of these before parsing:

- scheme: `https`
- host: `get.cbord.com`
- path: `/calpoly/full/history.php`

The capture script does not read forms, password fields, Duo prompt values, cookies, local/session storage, credentials, student identifiers, card numbers, or raw page HTML.

## Prerequisites for iOS development

- macOS
- Node.js 22+
- npm
- Xcode with an iOS Simulator installed

From the repository root:

```bash
npm install
```

## Normal development workflow

After pulling the latest `main`, rebuild the web bundle and sync Capacitor:

```bash
npm run mobile:sync
```

Then open the native project:

```bash
npm run mobile:open:ios
```

Choose an iPhone simulator (or a signed physical iPhone) in Xcode and press Run.

You can inspect the Capacitor environment with:

```bash
npm run mobile:doctor
```

## What to validate on a real account/device

Automated CI builds the production iOS target for the simulator, but the authenticated GET dependency still requires a live acceptance test. A successful validation is:

1. Tap **Connect GET** in the ChewMash iOS app.
2. Complete the real Cal Poly and Duo sign-in.
3. Reach GET Transaction History inside the in-app browser.
4. Confirm at least one Dining Dollars debit is parsed.
5. Confirm the browser dismisses and the Home dashboard reflects the synced transactions/balance.
6. Open Upload and run **Sync GET again** to verify deduplication.

If Cal Poly SSO or Duo explicitly blocks embedded WebViews, do not work around that restriction by collecting credentials. That result means the mobile browser architecture needs to change before release.

## Release path

Once the live authentication acceptance test passes, the remaining release work is standard iOS packaging rather than core app development: final icon/splash assets, signing/team configuration, physical-device QA, accessibility/device-size QA, App Store privacy metadata, and TestFlight distribution.
