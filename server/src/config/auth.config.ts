/**
 * The sign-in slice of the configuration.
 *
 * `env.ts` answers "is the environment valid?"; this file answers "who may sign
 * in, and how is the cookie shaped?". Keeping them apart is what lets the auth
 * module depend on a small, meaningful type instead of on a dozen string
 * variables — and lets a test build an `AuthConfig` in five lines.
 *
 * WHY ACCOUNTS LIVE IN CONFIGURATION AND NOT IN A DATABASE
 * --------------------------------------------------------
 * This is a workshop with a handful of staff, and the service is otherwise
 * stateless — it brokers OfficeGest and stores nothing. Adding a database to
 * hold five rows would add a migration story, a backup story and an
 * availability dependency, to solve a problem the client does not have. A JSON
 * file of accounts with scrypt hashes is the honest size of the requirement.
 *
 * The seam is `AuthService`, which is handed a list of users and never learns
 * where they came from. When "add a user" has to become a screen rather than an
 * edit, that list grows a repository behind it and nothing else changes.
 *
 * SIGN-IN IS OPT-IN
 * -----------------
 * With no accounts configured, `enabled` is `false` and the service behaves
 * exactly as it did before this module existed: the `x-api-key` guard, and
 * nothing else. That is what keeps a development checkout working without
 * ceremony — and `routes/index.ts` is careful that "no accounts" never means
 * "no guard" when a guard was configured.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

import {
  PERMISSIONS,
  ROLES,
  type AuthUser,
  type Permission,
  type Role,
} from '../modules/auth/auth.model.js';
import { isPasswordHash } from '../modules/auth/password.js';
import type { SameSite } from '../shared/http/cookies.js';
import { env } from './env.js';

export interface AuthCookieConfig {
  readonly name: string;
  readonly domain?: string;
  readonly path: string;
  readonly secure: boolean;
  readonly sameSite: SameSite;
}

export interface AuthConfig {
  /** `false` when no accounts are configured. Everything else is then unused. */
  readonly enabled: boolean;
  readonly sessionSecret: string;
  readonly users: readonly AuthUser[];
  readonly cookie: AuthCookieConfig;
  readonly session: { readonly absoluteTtlMs: number; readonly idleTtlMs: number };
  readonly login: {
    readonly maxAttempts: number;
    readonly windowMs: number;
    readonly lockMs: number;
  };
}

/** Thrown at startup when the account list cannot be used. */
export class AuthConfigError extends Error {
  override readonly name = 'AuthConfigError';

  constructor(readonly issues: readonly string[]) {
    super(
      `Invalid authentication configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}\n\n` +
        'Accounts come from AUTH_USERS (inline JSON) or AUTH_USERS_FILE (a path).\n' +
        'Generate a password hash with: npm --prefix server run hash:password',
    );
  }
}

/**
 * What a role means when an account does not spell its permissions out.
 *
 * Most accounts want one of these three, and listing nine strings per user is
 * how a typo gets into a permission set. Naming them here also documents the
 * intended shape of the team: one owner, a workshop manager, and staff who see
 * the day's work but not the settings.
 *
 * An explicit `permissions` array overrides this entirely — the default is a
 * convenience, not a ceiling.
 */
const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  ADMIN: PERMISSIONS,
  MANAGER: ['officegest.read', 'officegest.appointments.write', 'workers.read'],
  USER: ['officegest.read'],
};

const MINUTE_MS = 60_000;

const userSchema = z
  .object({
    /** Stable across a change of address; defaults to the e-mail. */
    id: z.string().trim().min(1).optional(),
    email: z.string().trim().min(3).includes('@', { message: 'must be an e-mail address' }),
    name: z.string().trim().min(1),
    role: z.enum(ROLES),
    permissions: z.array(z.enum(PERMISSIONS)).optional(),
    passwordHash: z.string().trim().min(1),
    disabled: z.boolean().default(false),
  })
  .strict();

const usersSchema = z.array(userSchema).min(1, 'must contain at least one account');

/**
 * Reads the account list.
 *
 * Failures name the file and the field, never a value: this input contains
 * password hashes, and an error message is the one place they would otherwise
 * reach a log.
 */
function loadUsers(): readonly AuthUser[] {
  const source = readSource();

  if (!source) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(source.contents);
  } catch (error) {
    throw new AuthConfigError([
      `${source.origin} is not valid JSON (${error instanceof Error ? error.message : 'parse failed'})`,
    ]);
  }

  const result = usersSchema.safeParse(parsed);

  if (!result.success) {
    throw new AuthConfigError(
      result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        return `${source.origin}: ${path} ${issue.message}`;
      }),
    );
  }

  const issues: string[] = [];
  const users: AuthUser[] = [];
  const seenEmails = new Set<string>();
  const seenIds = new Set<string>();

  result.data.forEach((entry, index) => {
    const where = `${source.origin}: account ${index + 1}`;
    // Addresses are compared case-insensitively at sign-in, so they must be
    // unique case-insensitively here — otherwise two accounts both match and
    // which one wins depends on array order.
    const email = entry.email.toLowerCase();
    const id = entry.id ?? email;

    if (!isPasswordHash(entry.passwordHash)) {
      issues.push(
        `${where} has an unusable passwordHash — expected scrypt$N$r$p$salt$hash, as ` +
          'produced by `npm --prefix server run hash:password`',
      );
    }

    if (seenEmails.has(email)) {
      issues.push(`${where} repeats an e-mail address already used by another account`);
    }

    if (seenIds.has(id)) {
      issues.push(`${where} repeats an id already used by another account`);
    }

    seenEmails.add(email);
    seenIds.add(id);

    users.push({
      id,
      email,
      name: entry.name,
      role: entry.role,
      permissions: entry.permissions ?? ROLE_PERMISSIONS[entry.role],
      passwordHash: entry.passwordHash,
      disabled: entry.disabled,
    });
  });

  if (issues.length > 0) {
    throw new AuthConfigError(issues);
  }

  if (users.every((user) => user.disabled)) {
    throw new AuthConfigError([
      `${source.origin}: every account is disabled, so nobody could sign in`,
    ]);
  }

  return users;
}

function readSource(): { readonly contents: string; readonly origin: string } | null {
  if (env.AUTH_USERS) {
    return { contents: env.AUTH_USERS, origin: 'AUTH_USERS' };
  }

  if (!env.AUTH_USERS_FILE) {
    return null;
  }

  const path = resolve(env.AUTH_USERS_FILE);

  try {
    return { contents: readFileSync(path, 'utf8'), origin: `AUTH_USERS_FILE (${path})` };
  } catch (error) {
    throw new AuthConfigError([
      `AUTH_USERS_FILE cannot be read: ${path} ` +
        `(${error instanceof Error ? error.message : 'unknown error'})`,
    ]);
  }
}

/**
 * Picks the cookie name.
 *
 * `__Host-` is a browser-enforced promise that the cookie is `Secure`, has no
 * `Domain`, and is scoped to `/` — so a subdomain, or a network attacker on a
 * sibling http origin, cannot overwrite the session. It is strictly better
 * where it is possible, and impossible where it is not: a browser silently
 * discards a `__Host-` cookie sent without `Secure`, which is exactly plain-http
 * local development.
 *
 * Hence the default is conditional, and an explicit name is checked against the
 * prefix's rules rather than being allowed to fail silently in the browser.
 */
function resolveCookie(): AuthCookieConfig {
  const secure = env.AUTH_COOKIE_SECURE ?? env.NODE_ENV === 'production';
  const domain = env.AUTH_COOKIE_DOMAIN;
  const canUseHostPrefix = secure && !domain;
  const name = env.AUTH_COOKIE_NAME ?? (canUseHostPrefix ? '__Host-fsa_session' : 'fsa_session');

  if (name.startsWith('__Host-') && !canUseHostPrefix) {
    throw new AuthConfigError([
      `AUTH_COOKIE_NAME "${name}" uses the __Host- prefix, which browsers accept only ` +
        'on a Secure cookie with no Domain. Set AUTH_COOKIE_SECURE=true and clear ' +
        'AUTH_COOKIE_DOMAIN, or choose a name without the prefix.',
    ]);
  }

  if (name.startsWith('__Secure-') && !secure) {
    throw new AuthConfigError([
      `AUTH_COOKIE_NAME "${name}" uses the __Secure- prefix, which requires ` +
        'AUTH_COOKIE_SECURE=true.',
    ]);
  }

  return { name, domain, path: '/', secure, sameSite: env.AUTH_COOKIE_SAMESITE };
}

let cached: AuthConfig | null = null;

/**
 * Builds the configuration once, on first use.
 *
 * Deliberately *not* built while this module is evaluated. An ES module's
 * imports run before any statement in the file that imported them, so a throw
 * at module scope escapes before `server.ts` reaches its own `try` — and the
 * operator gets a stack trace where the point of `AuthConfigError` is that they
 * get a sentence naming the file and the field. Reading accounts from disk on
 * first use puts the failure inside `createContainer`, where it can be caught
 * and printed as intended.
 *
 * Memoised, so the file is read once and every caller sees the same object.
 */
export function loadAuthConfig(): AuthConfig {
  if (cached) {
    return cached;
  }

  const users = loadUsers();

  cached = {
    enabled: users.length > 0,
    // `env.ts` guarantees the secret is present whenever accounts are. The
    // empty string is unreachable when `enabled`, and no session store is
    // built when it is not.
    sessionSecret: env.AUTH_SESSION_SECRET ?? '',
    users,
    cookie: resolveCookie(),
    session: {
      absoluteTtlMs: env.AUTH_SESSION_TTL_MINUTES * MINUTE_MS,
      idleTtlMs: env.AUTH_SESSION_IDLE_MINUTES * MINUTE_MS,
    },
    login: {
      maxAttempts: env.AUTH_LOGIN_MAX_ATTEMPTS,
      windowMs: env.AUTH_LOGIN_WINDOW_MINUTES * MINUTE_MS,
      lockMs: env.AUTH_LOGIN_LOCK_MINUTES * MINUTE_MS,
    },
  };

  return cached;
}
