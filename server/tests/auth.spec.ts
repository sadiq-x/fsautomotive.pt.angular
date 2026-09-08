/**
 * Sign-in end to end, over real HTTP, with only `fetch` faked.
 *
 * WHY THESE EXIST ON TOP OF `auth.service.spec.ts`
 * ------------------------------------------------
 * The unit tests prove the decisions. These prove the wiring — and the wiring
 * is where authentication actually fails: a cookie set without `HttpOnly`, a
 * guard mounted after the route it was meant to protect, a permission checked
 * on the list endpoint but not on the detail one. None of that is visible to a
 * test that calls the service directly.
 *
 * The application is rebuilt per scenario with a different environment, so each
 * of these drives the real middleware stack in the real order.
 */
import request from 'supertest';
import type { Express } from 'express';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { hashPassword } from '../src/modules/auth/password.js';
import type { Permission } from '../src/modules/auth/auth.model.js';
import { fakeFetch, LOGIN_OK, type CannedResponse } from './officegest-fetch.js';

/** Cheap parameters: these tests are about routing, not key derivation. */
const FAST = { N: 1024, r: 8, p: 1 } as const;

const PASSWORD = 'uma-palavra-passe-forte';
const EMAIL = 'ana@fsautomotive.pt';

const ORIGINAL = {
  users: process.env['AUTH_USERS'],
  secret: process.env['AUTH_SESSION_SECRET'],
  keys: process.env['BACKEND_API_KEYS'],
};

/** An allowed browser origin, per `tests/setup.ts`. */
const SITE_ORIGIN = 'http://localhost:4200';

let passwordHash: string;

beforeAll(async () => {
  passwordHash = await hashPassword(PASSWORD, FAST);
});

interface Account {
  readonly email?: string;
  readonly role?: 'ADMIN' | 'MANAGER' | 'USER';
  readonly permissions?: readonly Permission[];
  readonly disabled?: boolean;
}

/** Rebuilds the whole application with sign-in configured. */
async function appWith(
  accounts: readonly Account[] = [{}],
  script: readonly CannedResponse[] = [LOGIN_OK, { body: { data: [], meta: undefined } }],
  apiKeys = '',
): Promise<Express> {
  process.env['AUTH_USERS'] = JSON.stringify(
    accounts.map((account, index) => ({
      id: `user-${index + 1}`,
      email: account.email ?? EMAIL,
      name: 'Ana Silva',
      role: account.role ?? 'ADMIN',
      ...(account.permissions ? { permissions: account.permissions } : {}),
      ...(account.disabled ? { disabled: true } : {}),
      passwordHash,
    })),
  );
  process.env['AUTH_SESSION_SECRET'] = 'a-session-secret-long-enough-to-sign-with';
  process.env['BACKEND_API_KEYS'] = apiKeys;

  vi.resetModules();

  const { createApp } = await import('../src/app.js');
  const { createContainer } = await import('../src/container.js');
  const http = fakeFetch(script);

  return createApp(createContainer({ fetch: http.fetch, sleep: async () => undefined }));
}

/** The application as it is without any accounts — sign-in off. */
async function appWithoutAuth(): Promise<Express> {
  delete process.env['AUTH_USERS'];
  delete process.env['AUTH_SESSION_SECRET'];
  process.env['BACKEND_API_KEYS'] = '';

  vi.resetModules();

  const { createApp } = await import('../src/app.js');
  const { createContainer } = await import('../src/container.js');
  const http = fakeFetch([LOGIN_OK, { body: { data: [], meta: undefined } }]);

  return createApp(createContainer({ fetch: http.fetch, sleep: async () => undefined }));
}

afterEach(() => {
  process.env['AUTH_USERS'] = ORIGINAL.users;
  process.env['AUTH_SESSION_SECRET'] = ORIGINAL.secret;
  process.env['BACKEND_API_KEYS'] = ORIGINAL.keys;

  if (ORIGINAL.users === undefined) {
    delete process.env['AUTH_USERS'];
  }

  if (ORIGINAL.secret === undefined) {
    delete process.env['AUTH_SESSION_SECRET'];
  }

  vi.resetModules();
});

/** Signs in and returns the cookie header to replay on later requests. */
async function signIn(app: Express, email = EMAIL, password = PASSWORD): Promise<string> {
  const response = await request(app).post('/api/auth/login').send({ email, password }).expect(200);

  const cookies = response.headers['set-cookie'] as unknown as string[];

  return cookies.map((cookie) => cookie.split(';')[0]).join('; ');
}

describe('POST /api/auth/login', () => {
  it('returns the user and starts a session', async () => {
    const app = await appWith();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        id: 'user-1',
        email: EMAIL,
        name: 'Ana Silva',
        role: 'ADMIN',
        // ADMIN with no explicit list gets the role's full set.
        permissions: expect.arrayContaining(['officegest.read', 'settings.read']),
      },
    });
  });

  /**
   * The property the whole design rests on: the session is a cookie the browser
   * holds and JavaScript cannot read. Without `HttpOnly` an XSS flaw anywhere
   * on the site would hand over the session, and every claim in
   * `auth.contract.ts` about not storing a token would be pointless.
   */
  it('sets an HttpOnly, SameSite session cookie', async () => {
    const app = await appWith();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);

    const cookie = (response.headers['set-cookie'] as unknown as string[])[0];

    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//i);
    expect(cookie).toMatch(/Max-Age=\d+/i);
  });

  it('never puts the session token in the response body', async () => {
    const app = await appWith();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);

    const [cookie = ''] = response.headers['set-cookie'] as unknown as string[];
    const [, token = ''] = /^[^=]+=([^;]+)/.exec(cookie) ?? [];

    expect(token).not.toBe('');
    expect(JSON.stringify(response.body)).not.toContain(token);
  });

  it('refuses a wrong password without setting a cookie', async () => {
    const app = await appWith();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'not-the-password' })
      .expect(401);

    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('answers an unknown address exactly as it answers a wrong password', async () => {
    const app = await appWith();

    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@fsautomotive.pt', password: PASSWORD })
      .expect(401);

    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'wrong' })
      .expect(401);

    expect(unknown.body.error).toEqual(wrong.body.error);
  });

  it('never echoes the offered password back to the caller', async () => {
    const app = await appWith();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'guessed-value' })
      .expect(401);

    expect(JSON.stringify(response.body)).not.toContain('guessed-value');
  });

  it('never reveals the stored hash, whatever goes wrong', async () => {
    const app = await appWith();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'wrong' })
      .expect(401);

    expect(JSON.stringify(response.body)).not.toContain('scrypt');
    expect(JSON.stringify(response.body)).not.toContain(passwordHash);
  });

  it('rejects a malformed body before hashing anything', async () => {
    const app = await appWith();

    const response = await request(app).post('/api/auth/login').send({ email: EMAIL }).expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  /**
   * Every attempt costs a deliberate ~100 ms of scrypt whether the account
   * exists or not, so a flood of them is a denial of service that no
   * account-level counter would ever see.
   */
  it('rate-limits attempts from one address', async () => {
    const app = await appWith();

    for (let i = 0; i < 10; i += 1) {
      await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'wrong' });
    }

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(429);

    expect(response.headers['retry-after']).toBeDefined();
  });

  it('is not mounted at all when no accounts are configured', async () => {
    const app = await appWithoutAuth();

    await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(404);
  });
});

describe('GET /api/auth/session', () => {
  it('answers 401 for a visitor with no cookie', async () => {
    const app = await appWith();

    const response = await request(app).get('/api/auth/session').expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns the signed-in user', async () => {
    const app = await appWith();
    const cookie = await signIn(app);

    const response = await request(app).get('/api/auth/session').set('Cookie', cookie).expect(200);

    expect(response.body.data.email).toBe(EMAIL);
  });

  it('ignores a forged cookie', async () => {
    const app = await appWith();

    await request(app)
      .get('/api/auth/session')
      .set('Cookie', 'fsa_session=forged.c2lnbmF0dXJl')
      .expect(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('ends the session and clears the cookie', async () => {
    const app = await appWith();
    const cookie = await signIn(app);

    const response = await request(app).post('/api/auth/logout').set('Cookie', cookie).expect(204);

    expect((response.headers['set-cookie'] as unknown as string[])[0]).toMatch(/Max-Age=0/i);
    // The server-side record is gone, so replaying the old cookie is useless.
    await request(app).get('/api/auth/session').set('Cookie', cookie).expect(401);
  });

  /** Signing out is an intent, not a query: it succeeds even when idempotent. */
  it('succeeds for someone who is not signed in', async () => {
    const app = await appWith();

    await request(app).post('/api/auth/logout').expect(204);
  });
});

describe('the OfficeGest endpoints once sign-in is configured', () => {
  it('refuses an anonymous request', async () => {
    const app = await appWith();

    const response = await request(app).get('/api/officegest/customers').expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('serves a signed-in user', async () => {
    const app = await appWith();
    const cookie = await signIn(app);

    await request(app).get('/api/officegest/customers').set('Cookie', cookie).expect(200);
  });

  it('still serves a service holding an API key', async () => {
    const app = await appWith([{}], [LOGIN_OK, { body: { data: [], meta: undefined } }], 'a-key');

    await request(app).get('/api/officegest/customers').set('x-api-key', 'a-key').expect(200);
  });

  /**
   * The claim `auth.contract.ts` makes: the guards in the browser steer
   * navigation, and *this* is what decides which data leaves the building. A
   * visitor who edits the bundle to reach a page they may not see gets the page
   * and no data.
   */
  it('refuses a resource the session has no permission for', async () => {
    const app = await appWith([{ role: 'USER' }]);
    const cookie = await signIn(app);

    const response = await request(app)
      .get('/api/officegest/employees')
      .set('Cookie', cookie)
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('honours the officegest.read umbrella for read-only resources', async () => {
    const app = await appWith([{ role: 'USER' }]);
    const cookie = await signIn(app);

    await request(app).get('/api/officegest/vehicles').set('Cookie', cookie).expect(200);
  });

  it('is unguarded only when nothing at all is configured', async () => {
    const app = await appWithoutAuth();

    await request(app).get('/api/officegest/customers').expect(200);
  });
});

describe('cross-origin state-changing requests', () => {
  it('accepts a POST from the configured site origin', async () => {
    const app = await appWith();

    await request(app)
      .post('/api/auth/login')
      .set('Origin', SITE_ORIGIN)
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
  });

  /**
   * `SameSite=Lax` is the primary defence and would already stop this. The
   * check is the second lock, and the one that still holds if a genuinely
   * cross-site deployment has to configure `SameSite=None`.
   */
  it('refuses a POST from anywhere else', async () => {
    const app = await appWith();
    const cookie = await signIn(app);

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .set('Origin', 'https://evil.example')
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
    // The session must survive an attempt made on the user's behalf.
    await request(app).get('/api/auth/session').set('Cookie', cookie).expect(200);
  });

  /** `curl`, a health check, a server-to-server caller: no browser involved. */
  it('allows a request with no Origin header at all', async () => {
    const app = await appWith();

    await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
  });

  it('leaves reads alone, since a forged read nobody can read is not an attack', async () => {
    const app = await appWith();
    const cookie = await signIn(app);

    await request(app)
      .get('/api/auth/session')
      .set('Cookie', cookie)
      .set('Origin', 'https://evil.example')
      .expect(200);
  });
});

describe('a disabled account', () => {
  it('cannot sign in', async () => {
    const app = await appWith([{ disabled: true }, { email: 'bruno@fsautomotive.pt' }]);

    await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(401);
  });
});
