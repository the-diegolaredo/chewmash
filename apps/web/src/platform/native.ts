import { Capacitor, registerPlugin } from '@capacitor/core';
import type { DiningTransaction } from '../../../../src/lib/types';
import mobileCaptureScript from '../../../../src/get/mobile-capture.js?raw';

export interface MobileGetCapturePayload {
  version: number;
  capturedAt: string;
  tableCount: number;
  rowCount: number;
  matchedTransactions: number;
  balance: number | null;
  transactions: DiningTransaction[];
  cancelled?: boolean;
}

interface MobileGetSyncPlugin {
  sync(options: { captureScript: string }): Promise<MobileGetCapturePayload>;
}

const MobileGetSync = registerPlugin<MobileGetSyncPlugin>('MobileGetSync');

export function isNativeMobileApp(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

export async function captureGetOnDevice(): Promise<MobileGetCapturePayload> {
  if (!isNativeMobileApp()) {
    throw new Error('Native GET sync is only available inside the chewmash iOS app.');
  }
  return MobileGetSync.sync({ captureScript: mobileCaptureScript });
}
