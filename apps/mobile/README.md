# ChewMash mobile

This directory is the native Capacitor shell for ChewMash. The mobile app reuses the existing React/Vite build from `apps/web`; it does not load `chewmash.app` as a remote website and it does not duplicate the ChewMash UI.

## Current milestone

The first milestone is intentionally small: run the existing ChewMash interface inside an iOS simulator, then fix platform-specific issues before adding native storage, notifications, file picking, or the GET WebView connector.

The Capacitor app identity is:

- app name: `ChewMash`
- bundle/app id: `app.chewmash`
- bundled web assets: `apps/web/dist`

## Prerequisites for iOS

- macOS
- Node.js 22+
- npm
- Xcode with an iOS Simulator installed

Install JavaScript dependencies from the repository root:

```bash
npm install
```

## Create the iOS project once

From the repository root:

```bash
npm run mobile:add:ios
```

That command first builds `apps/web/dist`, then runs Capacitor from this directory so the generated native project lives at:

```text
apps/mobile/ios/
```

The generated iOS project should be committed to the repository once it has been created and verified.

## Normal development workflow

After the iOS project exists, rebuild the web app and copy/sync it into the native project with:

```bash
npm run mobile:sync
```

Open the native project in Xcode with:

```bash
npm run mobile:open:ios
```

Then choose an iPhone simulator in Xcode and press Run.

You can inspect the Capacitor environment with:

```bash
npm run mobile:doctor
```

## What comes next

After the current ChewMash UI runs correctly in the simulator, the planned order is:

1. isolate and verify mobile-safe local storage
2. add a native document picker for PDF import
3. add native/local notifications
4. prototype a visible in-app GET WebView
5. validate Cal Poly authentication inside that WebView
6. reuse the existing GET parsing/normalization logic to import structured dining data
7. test on a physical iPhone and prepare TestFlight

The GET proof of concept should remain user-initiated and should only parse the allowlisted Transaction History page. ChewMash should not read or store Cal Poly credentials, session tokens, raw cookies, or complete page HTML.
