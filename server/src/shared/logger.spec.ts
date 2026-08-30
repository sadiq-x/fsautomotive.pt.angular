/**
 * The one guarantee this project cannot afford to lose: no credential reaches a
 * log line. Everything else about logging is a convenience.
 */
import { describe, expect, it } from 'vitest';

import { redact, REDACTED } from './logger.js';

describe('redact', () => {
  it('hides values under sensitive keys, whatever their casing or separator', () => {
    const output = redact({
      apiKey: 'secret',
      API_KEY: 'secret',
      'api-key': 'secret',
      officegestApiKey: 'secret',
      Authorization: 'Bearer secret',
      password: 'secret',
      access_token: 'secret',
      'set-cookie': 'session=secret',
    }) as Record<string, unknown>;

    for (const value of Object.values(output)) {
      expect(value).toBe(REDACTED);
    }
  });

  it('keeps values that are safe to see', () => {
    expect(redact({ path: '/entities/customers', status: 200, durationMs: 12 })).toEqual({
      path: '/entities/customers',
      status: 200,
      durationMs: 12,
    });
  });

  it('reaches nested objects and arrays, so a whole headers bag is safe to log', () => {
    const output = redact({
      request: { headers: { authorization: 'Bearer secret', accept: 'application/json' } },
      attempts: [{ token: 'secret' }],
    }) as { request: { headers: Record<string, string> }; attempts: Record<string, string>[] };

    expect(output.request.headers['authorization']).toBe(REDACTED);
    expect(output.request.headers['accept']).toBe('application/json');
    expect(output.attempts[0]?.['token']).toBe(REDACTED);
  });

  it('summarises an Error rather than serialising its stack', () => {
    expect(redact(new Error('boom'))).toEqual({ name: 'Error', message: 'boom' });
  });

  it('stops recursing on deeply nested input instead of hanging', () => {
    const deep: Record<string, unknown> = {};
    let cursor = deep;

    for (let i = 0; i < 50; i++) {
      const next: Record<string, unknown> = {};
      cursor['next'] = next;
      cursor = next;
    }

    expect(() => redact(deep)).not.toThrow();
  });
});
