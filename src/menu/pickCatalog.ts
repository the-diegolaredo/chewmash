import { RECORDED_MENU_ITEMS, type RecordedMenuItem } from './grubhub';
import { RECORDED_MENU_SUPPLEMENT } from './grubhubSupplement';

function dedupeCatalog(items: RecordedMenuItem[]): RecordedMenuItem[] {
  const byId = new Map<string, RecordedMenuItem>();
  for (const item of items) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()];
}

export const PICK_MENU_ITEMS: RecordedMenuItem[] = dedupeCatalog([
  ...RECORDED_MENU_ITEMS,
  ...RECORDED_MENU_SUPPLEMENT,
]);
