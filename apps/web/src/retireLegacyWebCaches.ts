export async function retireLegacyWebCaches(): Promise<void> {
  // The current chewmash web app does not use a service worker or Cache Storage.
  // Clear any leftovers from older deployments without touching IndexedDB or
  // localStorage, where chewmash keeps the user's dining data and settings.
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }
  } catch {
    // Cache cleanup is best-effort and should never block the app from loading.
  }

  try {
    if ('caches' in globalThis) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    }
  } catch {
    // Same principle here: preserve app startup even if the browser blocks access.
  }
}
