import { createStateRepository, type StorageAreaLike } from './repository';
import { sanitizeState, type ChewMashState } from './state';

const DB_NAME = 'chewmash-web';
const DB_VERSION = 1;
const STORE_NAME = 'key-value';
const LEGACY_LOCAL_STORAGE_KEY = 'chewmash:v1';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in globalThis)) {
    return Promise.reject(new Error('This browser does not support local IndexedDB storage.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local chewmash storage.'));
  });
}

const indexedDbStorage: StorageAreaLike = {
  async get(key) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const done = transactionDone(transaction);
      const value = await requestResult(transaction.objectStore(STORE_NAME).get(key));
      await done;
      return value === undefined ? {} : { [key]: value };
    } finally {
      database.close();
    }
  },

  async set(items) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const done = transactionDone(transaction);
      const store = transaction.objectStore(STORE_NAME);
      for (const [key, value] of Object.entries(items)) store.put(value, key);
      await done;
    } finally {
      database.close();
    }
  },

  async remove(key) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const done = transactionDone(transaction);
      transaction.objectStore(STORE_NAME).delete(key);
      await done;
    } finally {
      database.close();
    }
  },
};

export const webStateRepository = createStateRepository(indexedDbStorage);

/**
 * Preserve data from the original GitHub Pages prototype when the new web app
 * is deployed on the same origin. Nothing is uploaded or removed; the old
 * localStorage value is only copied into the typed IndexedDB repository once.
 */
export async function migrateLegacyWebState(): Promise<ChewMashState> {
  const current = await webStateRepository.load();
  const alreadyHasState = current.updatedAt !== null
    || current.transactions.length > 0
    || current.balanceSnapshots.length > 0;
  if (alreadyHasState || typeof localStorage === 'undefined') return current;

  const raw = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
  if (!raw) return current;

  try {
    return await webStateRepository.save(sanitizeState(JSON.parse(raw)));
  } catch {
    return current;
  }
}
