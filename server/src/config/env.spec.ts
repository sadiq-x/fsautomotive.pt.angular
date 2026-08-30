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
