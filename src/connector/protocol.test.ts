import { describe, expect, it } from 'vitest';
import {
  CONNECTOR_EXTENSION_SOURCE,
  CONNECTOR_WEB_SOURCE,
  isConnectorPageMessage,
  isConnectorRequest,
} from './protocol';

describe('connector protocol', () => {
  it('accepts only the three web connector actions', () => {
    expect(isConnectorRequest({
      source: CONNECTOR_WEB_SOURCE,
      type: 'CHEWMASH_CONNECTOR_REQUEST',
      action: 'sync',
      requestId: 'abc',
    })).toBe(true);

    expect(isConnectorRequest({
      source: CONNECTOR_WEB_SOURCE,
      type: 'CHEWMASH_CONNECTOR_REQUEST',
      action: 'cookies',
      requestId: 'abc',
    })).toBe(false);
  });

  it('rejects messages that do not come from the chewmash connector namespace', () => {
    expect(isConnectorPageMessage({
      source: CONNECTOR_EXTENSION_SOURCE,
      type: 'CHEWMASH_CONNECTOR_READY',
      payload: { version: '0.5.0' },
    })).toBe(true);

    expect(isConnectorPageMessage({
      source: 'other-extension',
      type: 'CHEWMASH_CONNECTOR_READY',
      payload: { version: '0.5.0' },
    })).toBe(false);
  });
});
