# chewmash mobile GET sync prototype

This is a deliberately small iOS proof of concept for the mobile-first GET flow:

1. Open chewmash.
2. Tap **Sync GET**.
3. A temporary in-app `WKWebView` opens `https://get.cbord.com/calpoly/full/history.php`.
4. The student completes Cal Poly / Duo / GET authentication normally.
5. chewmash waits without inspecting authentication pages.
6. Only when the exact GET Transaction History URL finishes loading, the app injects `src/get/mobile-capture.js`.
7. The script extracts sanitized transaction fields (`date`, `time`, `rawLocation`, normalized `location`, `amount`) and an optional visible balance.
8. The native prototype stores that sanitized payload locally and automatically dismisses the in-app browser.

## Privacy boundary

The prototype never injects the capture script into Cal Poly login, Duo, or any other page. The native navigation delegate checks all three of these before parsing:

- scheme: `https`
- host: `get.cbord.com`
- path: `/calpoly/full/history.php`

The capture script does not inspect form controls, cookies, local/session storage, credentials, student identifiers, card numbers, or raw HTML. It reads table cell text and optional visible balance text only.

The `WKWebView` uses `WKWebsiteDataStore.nonPersistent()`, so the browser session is ephemeral. That means the proof of concept may require a fresh sign-in on every sync; this is intentional for the first security test.

## Run it on an iPhone

This project uses [XcodeGen](https://github.com/yonaskolb/XcodeGen) so generated Xcode project files do not need to be committed.

```bash
brew install xcodegen
cd prototypes/mobile-get-sync/ios
xcodegen generate
open ChewmashGetSyncPrototype.xcodeproj
```

In Xcode:

1. Select your Apple development team for the `ChewmashGetSyncPrototype` target.
2. Connect an iPhone.
3. Select the iPhone as the run destination.
4. Build and run.
5. Tap **Sync GET** and complete the real Cal Poly login flow.

## What success means

The experiment succeeds if all of the following happen on a real device:

- Cal Poly SSO and Duo can complete inside the controlled `WKWebView`.
- GET reaches `/calpoly/full/history.php`.
- the parser reports at least one debit transaction.
- the browser dismisses automatically.
- the prototype screen shows the sanitized transaction count.

If SSO or Duo blocks embedded web views, that is the key finding. We should not work around an identity-provider restriction by collecting credentials; instead we would revisit the mobile architecture.

## Scope

This is intentionally **not** the production mobile app yet. It proves the riskiest dependency first: authenticated GET access inside an in-app browser. The existing web app, connector, budgeting logic, and Picks behavior are untouched.
