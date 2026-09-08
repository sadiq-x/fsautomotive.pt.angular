import { describe, expect, it } from 'vitest';

import { DEFAULT_SCRYPT_PARAMS, hashPassword, isPasswordHash, verifyPassword } from './password.js';

/**
 * Cheap parameters, so the suite is not dominated by key derivation. The
 * property being tested is the encoding and the comparison, neither of which
 * depends on the cost — and `DEFAULT_SCRYPT_PARAMS` is asserted separately.
 */
const FAST = { N: 1024, r: 8, p: 1 } as const;

describe('hashPassword', () => {
  it('produces a hash its own verifier accepts', async () => {
    const hash = await hashPassword('correct horse battery staple', FAST);

    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple', FAST);

    await expect(verifyPassword('Correct horse battery staple', hash)).resolves.toBe(false);
  });

  /** A shared salt would let one rainbow table cover every account at once. */
  it('salts, so the same password hashes differently every time', async () => {
    const first = await hashPassword('same password', FAST);
    const second = await hashPassword('same password', FAST);

    expect(first).not.toBe(second);
    await expect(verifyPassword('same password', first)).resolves.toBe(true);
    await expect(verifyPassword('same password', second)).resolves.toBe(true);
  });

  it('records the parameters, so raising the cost does not invalidate old hashes', async () => {
    const hash = await hashPassword('a password', FAST);

    expect(hash.startsWith(`scrypt$${FAST.N}$${FAST.r}$${FAST.p}$`)).toBe(true);
    // Verified with the parameters in the hash, not with today's defaults.
    await expect(verifyPassword('a password', hash)).resolves.toBe(true);
  });

  /**
   * "ã" typed as one code point and as "a" + combining tilde look identical and
   * are the same password to the person typing them.
   */
  it('normalises unicode, so the same characters typed differently still match', async () => {
    const composed = 'oficina-avançãda';
    const precomposed = composed.normalize('NFKC');

    expect(composed).not.toBe(precomposed);

    const hash = await hashPassword(composed, FAST);
    await expect(verifyPassword(precomposed, hash)).resolves.toBe(true);
  });

  it('uses a cost high enough to matter, by default', () => {
    // A regression guard, not a preference: the whole defence against an
    // offline attack on a leaked hash is this number.
    expect(DEFAULT_SCRYPT_PARAMS.N).toBeGreaterThanOrEqual(16_384);
  });
});

describe('isPasswordHash', () => {
  it('accepts what hashPassword produces', async () => {
    expect(isPasswordHash(await hashPassword('x', FAST))).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['a plain password mistakenly pasted in place of a hash', 'hunter2'],
    ['a bcrypt hash', '$2b$12$abcdefghijklmnopqrstuv'],
    ['the wrong scheme', 'pbkdf2$1024$8$1$c2FsdA==$aGFzaA=='],
    ['too few fields', 'scrypt$1024$8$c2FsdA=='],
    ['a non-numeric cost', 'scrypt$many$8$1$c2FsdA==$aGFzaA=='],
    ['a short salt', 'scrypt$1024$8$1$c2E=$aGFzaGhhc2hoYXNoaGFzaA=='],
  ])('rejects %s', (_label, value) => {
    expect(isPasswordHash(value)).toBe(false);
  });

  /**
   * scrypt itself requires N to be a power of two. Without this check the
   * failure would come from inside the derivation — a 500 at sign-in rather
   * than a refusal to start.
   */
  it('rejects a cost that is not a power of two', () => {
    expect(isPasswordHash('scrypt$1000$8$1$c2FsdHNhbHRzYWx0$aGFzaGhhc2hoYXNoaGFzaA==')).toBe(false);
  });

  /**
   * The account list is a file. A mistyped `N` of 2^30 would turn one sign-in
   * attempt into an out-of-memory crash — a denial of service written in
   * configuration.
   */
  it('rejects a cost large enough to exhaust the server', () => {
    expect(isPasswordHash(`scrypt$${1 << 25}$8$1$c2FsdHNhbHRzYWx0$aGFzaGhhc2hoYXNoaGFzaA==`)).toBe(
      false,
    );
  });
});

describe('verifyPassword', () => {
  /**
   * Startup rejects unusable hashes, so reaching one here means the
   * configuration changed under a running process. Refusing the sign-in is the
   * safe reading; throwing would be a 500 that says a password was "wrong".
   */
  it('returns false for an unusable hash instead of throwing', async () => {
    await expect(verifyPassword('anything', 'not-a-hash')).resolves.toBe(false);
  });
});
