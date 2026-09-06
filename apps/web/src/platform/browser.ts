import type { ChewMashState } from '../../../../src/storage/state';

export function downloadBackup(state: ChewMashState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = 'chewmash-backup.json';
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
}

export function requestPersistentBrowserStorage(): void {
  if (navigator.storage?.persist) void navigator.storage.persist();
}

export function confirmClearDiningData(): boolean {
  return window.confirm('Clear imported transactions and balance snapshots? Your plan settings will remain.');
}

export function confirmLogOut(): boolean {
  return window.confirm(
    'Log out of chewmash on this device? chewmash has no server account, so logging out removes the local plan and dining data stored in this browser. Export a backup first if you want to keep a copy.',
  );
}

export function clearLegacyBrowserState(): void {
  localStorage.removeItem('chewmash:v1');
}

export function reloadWebApp(): void {
  window.location.reload();
}
