import { afterEach, describe, expect, it, vi } from 'vitest';
import { retireLegacyWebCaches } from './retireLegacyWebCaches';

describe('retireLegacyWebCaches', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('unregisters legacy service workers and deletes Cache Storage without touching app data', async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    const getRegistrations = vi.fn().mockResolvedValue([{ unregister }]);
    const keys = vi.fn().mockResolvedValue(['legacy-shell', 'old-assets']);
    const remove = vi.fn().mockResolvedValue(true);

    vi.stubGlobal('navigator', { serviceWorker: { getRegistrations } });
    vi.stubGlobal('caches', { keys, delete: remove });

    await retireLegacyWebCaches();

    expect(getRegistrations).toHaveBeenCalledOnce();
    expect(unregister).toHaveBeenCalledOnce();
    expect(keys).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledWith('legacy-shell');
    expect(remove).toHaveBeenCalledWith('old-assets');
  });
});
