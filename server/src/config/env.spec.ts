/**
 * Startup validation. The property that matters most is negative: whatever the
 * environment is, the credential must not appear in the error message.
 */
import { describe, expect, it } from 'vitest';

import { EnvValidationError, parseEnv } from './env.js';

const VALID = {
  OFFICEGEST_BASE_URL: 'https://tenant.officegest.com/api/v2',
  OFFICEGEST_AUTH_MODE: 'bearer-login',
  OFFICEGEST_USERNAME: 'api-user',
  OFFICEGEST_API_KEY: 'super-secret-value',
} satisfies NodeJS.ProcessEnv;

describe('parseEnv', () => {
  it('accepts a minimal valid environment and applies defaults', () => {
    const env = parseEnv({ ...VALID });

    expect(env.PORT).toBe(3000);
    expect(env.OFFICEGEST_TIMEOUT_MS).toBe(10_000);
    expect(env.OFFICEGEST_MAX_RETRIES).toBe(2);
    expect(env.NODE_ENV).toBe('development');
  });

  it('strips a trailing slash from the base URL so paths never double up', () => {
    const env = parseEnv({
      ...VALID,
      OFFICEGEST_BASE_URL: 'https://tenant.officegest.com/api/v2/',
    });

    expect(env.OFFICEGEST_BASE_URL).toBe('https://tenant.officegest.com/api/v2');
  });

  it('reports every problem at once rather than one per restart', () => {
    try {
      parseEnv({ OFFICEGEST_BASE_URL: 'not-a-url', OFFICEGEST_AUTH_MODE: 'bearer-login' });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      const issues = (error as EnvValidationError).issues;
      expect(issues.some((issue) => issue.startsWith('OFFICEGEST_BASE_URL'))).toBe(true);
      expect(issues.some((issue) => issue.startsWith('OFFICEGEST_USERNAME'))).toBe(true);
    }
  });

  /**
   * One cause, one line.
   *
   * An unset OFFICEGEST_BASE_URL used to report both "is required" and "must be
   * an absolute URL": Zod collects every check on a string, and the URL parse
   * fails on `''` too. The second line reads like a separate problem and sends
   * you hunting for a malformed value that was never there.
   */
  it('reports an unset base URL once, not as two contradictory problems', () => {
    try {
      parseEnv({ ...VALID, OFFICEGEST_BASE_URL: '' });
      expect.unreachable('should have thrown');
    } catch (error) {
      const issues = (error as EnvValidationError).issues.filter((issue) =>
        issue.startsWith('OFFICEGEST_BASE_URL'),
      );

      expect(issues).toEqual(['OFFICEGEST_BASE_URL is required']);
    }
  });

  // A malformed value is a different problem, and must still be reported.
  it('still reports a malformed base URL', () => {
    try {
      parseEnv({ ...VALID, OFFICEGEST_BASE_URL: 'not-a-url' });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as EnvValidationError).issues).toContain(
        'OFFICEGEST_BASE_URL must be an absolute URL, e.g. https://host/api/v2',
      );
    }
  });

  // The commonest first-run mistake is filling in `.env.example`, which nothing
  // loads. The failure has to say so, or it reads as "I set it and it is wrong".
  it('names the files it actually reads, and that the example is not one', () => {
    try {
      parseEnv({});
      expect.unreachable('should have thrown');
    } catch (error) {
      const message = (error as Error).message;

      expect(message).toContain('server/.env');
      expect(message).toContain('server/.env.example is a template');
    }
  });

  it('never repeats a credential in the failure message', () => {
    try {
      // A valid key, but no username — so the error is about the pair.
      parseEnv({ ...VALID, OFFICEGEST_USERNAME: '' });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as Error).message).not.toContain('super-secret-value');
    }
  });

  it('accepts OFFICEGEST_API_KEY in place of OFFICEGEST_PASSWORD', () => {
    expect(() => parseEnv({ ...VALID })).not.toThrow();
  });

  it('requires a username for the credential-pair modes', () => {
    expect(() => parseEnv({ ...VALID, OFFICEGEST_USERNAME: undefined })).toThrow(
      EnvValidationError,
    );
  });

  it('requires only the key for static-token mode', () => {
    const env = parseEnv({
      OFFICEGEST_BASE_URL: VALID.OFFICEGEST_BASE_URL,
      OFFICEGEST_AUTH_MODE: 'static-token',
      OFFICEGEST_API_KEY: 'a-token',
    });

    expect(env.OFFICEGEST_AUTH_MODE).toBe('static-token');
  });

  it('rejects static-token mode with no key', () => {
    expect(() =>
      parseEnv({
        OFFICEGEST_BASE_URL: VALID.OFFICEGEST_BASE_URL,
        OFFICEGEST_AUTH_MODE: 'static-token',
      }),
    ).toThrow(EnvValidationError);
  });

  it('refuses plain http in production, where the credential would travel in clear', () => {
    expect(() =>
      parseEnv({
        ...VALID,
        NODE_ENV: 'production',
        OFFICEGEST_BASE_URL: 'http://tenant.officegest.com/api/v2',
      }),
    ).toThrow(EnvValidationError);
  });

  it('allows plain http outside production, for a local mock server', () => {
    expect(() =>
      parseEnv({ ...VALID, OFFICEGEST_BASE_URL: 'http://localhost:8080/api/v2' }),
    ).not.toThrow();
  });

  it('parses comma-separated lists and drops blank entries', () => {
    const env = parseEnv({ ...VALID, CORS_ALLOWED_ORIGINS: 'https://a.pt, ,https://b.pt' });

    expect(env.CORS_ALLOWED_ORIGINS).toEqual(['https://a.pt', 'https://b.pt']);
  });

  it('rejects an out-of-range port instead of falling back to a default', () => {
    expect(() => parseEnv({ ...VALID, PORT: '70000' })).toThrow(EnvValidationError);
  });
});
