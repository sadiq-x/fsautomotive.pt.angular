import { afterEach, describe, expect, it } from 'vitest';

import type { AuthConfig } from '../../config/auth.config.js';
import { AppError } from '../../shared/errors/index.js';
import type { Logger } from '../../shared/logger.js';
import { AuthService } from './auth.service.js';
import { hashPassword } from './password.js';

const MINUTE = 60_000;

/** Cheap parameters: this suite tests decisions, not key derivation. */
const FAST = { N: 1024, r: 8, p: 1 } as const;

const silent: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  child: () => silent,
};

async function configFor(
  overrides: Partial<AuthConfig> = {},
  users?: readonly { email: string; password: string; disabled?: boolean }[],
): Promise<AuthConfig> {
  const accounts = users ?? [{ email: 'ana@fsautomotive.pt', password: 'a-good-password' }];

  return {
    enabled: true,
    sessionSecret: 'a-secret-long-enough-to-sign-a-cookie-with',
    users: await Promise.all(
      accounts.map(async (account, index) => ({
        id: `user-${index + 1}`,
        email: account.email,
        name: 'Ana Silva',
        role: 'ADMIN' as const,
        permissions: ['officegest.read'] as const,
        passwordHash: await hashPassword(account.password, FAST),
        disabled: account.disabled ?? false,
      })),
    ),
    cookie: { name: 'fsa_session', path: '/', secure: false, sameSite: 'lax' },
    session: { absoluteTtlMs: 8 * 60 * MINUTE, idleTtlMs: 60 * MINUTE },
    login: { maxAttempts: 3, windowMs: 15 * MINUTE, lockMs: 15 * MINUTE },
    ...overrides,
  };
}

const services: AuthService[] = [];

function track(service: AuthService): AuthService {
  services.push(service);
  return service;
}

afterEach(() => {
  services.splice(0).forEach((service) => service.dispose());
});

function attempt(email: string, password: string, address = '203.0.113.5') {
  return { email, password, address, logger: silent };
}

describe('AuthService.login', () => {
  it('accepts the right password and returns the user without its hash', async () => {
    const service = track(new AuthService(await configFor()));

    const result = await service.login(attempt('ana@fsautomotive.pt', 'a-good-password'));

    expect(result.user).toEqual({
      id: 'user-1',
      email: 'ana@fsautomotive.pt',
      name: 'Ana Silva',
      role: 'ADMIN',
      permissions: ['officegest.read'],
    });
    expect(JSON.stringify(result.user)).not.toContain('scrypt');
  });

  /** People do not type their address the way it was configured. */
  it('matches the address case-insensitively', async () => {
    const service = track(new AuthService(await configFor()));

    await expect(
      service.login(attempt('  ANA@FSAutomotive.pt  ', 'a-good-password')),
    ).resolves.toBeDefined();
  });

  it('refuses a wrong password', async () => {
    const service = track(new AuthService(await configFor()));

    await expect(service.login(attempt('ana@fsautomotive.pt', 'wrong'))).rejects.toMatchObject({
      httpStatus: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });

  /**
   * The enumeration guarantee. An unknown address and a wrong password must be
   * indistinguishable to the caller — otherwise the login form is a directory
   * of who works here.
   */
  it('answers identically for an unknown address and a wrong password', async () => {
    const service = track(new AuthService(await configFor()));

    const unknown = await service.login(attempt('nobody@fsautomotive.pt', 'x')).catch((e) => e);
    const wrong = await service.login(attempt('ana@fsautomotive.pt', 'x')).catch((e) => e);

    expect(unknown).toBeInstanceOf(AppError);
    expect({ status: unknown.httpStatus, code: unknown.code, message: unknown.message }).toEqual({
      status: wrong.httpStatus,
      code: wrong.code,
      message: wrong.message,
    });
  });

  it('refuses a disabled account even with the right password', async () => {
    const service = track(
      new AuthService(
        await configFor({}, [
          { email: 'ana@fsautomotive.pt', password: 'a-good-password', disabled: true },
          { email: 'bruno@fsautomotive.pt', password: 'another-password' },
        ]),
      ),
    );

    await expect(
      service.login(attempt('ana@fsautomotive.pt', 'a-good-password')),
    ).rejects.toMatchObject({ httpStatus: 401, code: 'INVALID_CREDENTIALS' });
  });

  it('locks the account out after the configured number of failures', async () => {
    const service = track(new AuthService(await configFor()));

    for (let i = 0; i < 3; i += 1) {
      await expect(service.login(attempt('ana@fsautomotive.pt', 'wrong'))).rejects.toBeDefined();
    }

    // Even the correct password now, which is the point: the attacker cannot
    // tell whether their last guess would have worked.
    await expect(
      service.login(attempt('ana@fsautomotive.pt', 'a-good-password')),
    ).rejects.toMatchObject({ httpStatus: 429, code: 'ACCOUNT_LOCKED' });
  });

  /**
   * A lock-out scoped to the account alone would let anyone lock a named
   * colleague out of their own account from anywhere on the internet.
   */
  it('locks per client address, so an attacker cannot lock a colleague out', async () => {
    const service = track(new AuthService(await configFor()));

    for (let i = 0; i < 3; i += 1) {
      await expect(
        service.login(attempt('ana@fsautomotive.pt', 'wrong', '198.51.100.9')),
      ).rejects.toBeDefined();
    }

    await expect(
      service.login(attempt('ana@fsautomotive.pt', 'a-good-password', '203.0.113.5')),
    ).resolves.toBeDefined();
  });

  it('clears the count on success, so a morning of typos is not a lock-out', async () => {
    const service = track(new AuthService(await configFor()));

    await expect(service.login(attempt('ana@fsautomotive.pt', 'wrong'))).rejects.toBeDefined();
    await expect(service.login(attempt('ana@fsautomotive.pt', 'wrong'))).rejects.toBeDefined();
    await expect(
      service.login(attempt('ana@fsautomotive.pt', 'a-good-password')),
    ).resolves.toBeDefined();

    await expect(service.login(attempt('ana@fsautomotive.pt', 'wrong'))).rejects.toBeDefined();
    await expect(
      service.login(attempt('ana@fsautomotive.pt', 'a-good-password')),
    ).resolves.toBeDefined();
  });

  /**
   * Password spraying: a few guesses each against many addresses. The
   * per-account counter never sees it, because no account is tried twice.
   */
  it('locks a client address that sprays many accounts', async () => {
    const service = track(new AuthService(await configFor()));

    // maxAttempts (3) × the address multiplier (5).
    for (let i = 0; i < 15; i += 1) {
      await expect(
        service.login(attempt(`person-${i}@fsautomotive.pt`, 'guess', '198.51.100.9')),
      ).rejects.toBeDefined();
    }

    await expect(
      service.login(attempt('ana@fsautomotive.pt', 'a-good-password', '198.51.100.9')),
    ).rejects.toMatchObject({ httpStatus: 429 });
  });
});

describe('AuthService.resolve', () => {
  it('resolves the session it issued', async () => {
    const service = track(new AuthService(await configFor()));

    const { session } = await service.login(attempt('ana@fsautomotive.pt', 'a-good-password'));

    expect(service.resolve(session.token)?.email).toBe('ana@fsautomotive.pt');
  });

  it('resolves nothing for a missing or forged cookie', async () => {
    const service = track(new AuthService(await configFor()));

    expect(service.resolve(undefined)).toBeNull();
    expect(service.resolve('forged.aGVsbG8')).toBeNull();
  });

  it('stops resolving once the session is signed out', async () => {
    const service = track(new AuthService(await configFor()));

    const { session } = await service.login(attempt('ana@fsautomotive.pt', 'a-good-password'));
    service.logout(session.token);

    expect(service.resolve(session.token)).toBeNull();
  });

  /**
   * Signing out on one device must not sign the person out on the other. The
   * alternative — invalidating every session on sign-out — is a surprise, not a
   * security property.
   */
  it('leaves other sessions of the same user alone', async () => {
    const service = track(new AuthService(await configFor()));

    const phone = await service.login(attempt('ana@fsautomotive.pt', 'a-good-password'));
    const desk = await service.login(attempt('ana@fsautomotive.pt', 'a-good-password'));

    service.logout(phone.session.token);

    expect(service.resolve(desk.session.token)?.email).toBe('ana@fsautomotive.pt');
  });
});

describe('AuthService when no accounts are configured', () => {
  it('reports itself disabled and resolves nothing', async () => {
    const service = track(new AuthService(await configFor({ enabled: false, users: [] })));

    expect(service.enabled).toBe(false);
    expect(service.resolve('anything.at-all')).toBeNull();
  });

  it('refuses to sign anyone in rather than failing obscurely', async () => {
    const service = track(new AuthService(await configFor({ enabled: false, users: [] })));

    await expect(service.login(attempt('ana@fsautomotive.pt', 'x'))).rejects.toBeInstanceOf(
      AppError,
    );
  });
});
