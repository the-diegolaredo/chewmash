import { browser } from 'wxt/browser';
import { createStateRepository, type StorageAreaLike } from './repository';

const extensionStorage: StorageAreaLike = {
  async get(key) {
    return await browser.storage.local.get(key) as Record<string, unknown>;
  },
  async set(items) {
    await browser.storage.local.set(items);
  },
  async remove(key) {
    await browser.storage.local.remove(key);
  },
};

export const stateRepository = createStateRepository(extensionStorage);
