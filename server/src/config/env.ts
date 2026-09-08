/**
 * The single place this process reads `process.env`.
 *
 * WHY THIS EXISTS
 * ---------------
 * Reading `process.env.X` at the point of use spreads three problems through a
 * codebase: every reader has to re-decide what a missing value means, the types
 * are all `string | undefined`, and a misconfiguration is only discovered when
 * the code path that needs it finally runs — often in production, hours after
 * the deploy. Parsing once at startup turns all three into a single, loud
 * failure before the server accepts its first connection.
 *
 * The parsed result is the only thing the rest of the application imports, so
 * `config.officegest.apiKey` replaces `process.env.OFFICEGEST_API_KEY`
 * everywhere.
 *
 * SECURITY
 * --------
 * Values are never logged or echoed. When validation fails, the error names the
 * variables and the reason — never the value it received, because the value is
 * the credential.
 */
import { z } from 'zod';

/**
 * How the OfficeGest client authenticates.
 *
 * `bearer-login` and `basic` are the two mechanisms OfficeGest documents.
 * `static-token` exists for tenants that were handed a ready-made token; see
 * the note on `staticToken` in `officegest.config.ts` before choosing it.
 */
export const OFFICEGEST_AUTH_MODES = ['bearer-login', 'basic', 'static-token'] as const;

export type OfficeGestAuthMode = (typeof OFFICEGEST_AUTH_MODES)[number];

/** Trims a string variable and treats whitespace-only as "not set". */
const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional();

/**
 * An absolute `http(s)` URL, without a trailing slash.
 *
 * Plain `http` is rejected outside development: the API key travels on every
 * upstream request, so an unencrypted hop would leak it wholesale.
 */
const baseUrl = z
  .string()
  .trim()
  .min(1, 'is required')
  .superRefine((value, ctx) => {
    // Zod runs every check on a string and collects all of them, so an unset
    // variable would otherwise be reported twice — "is required" *and* "must be
    // an absolute URL". Two lines for one cause reads like two problems, and
    // the second one sends the reader looking for a malformed value that is not
    // there. `min(1)` has already said what is wrong.
    if (value === '') {
      return;
    }

    let url: URL;

    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: 'must be an absolute URL, e.g. https://host/api/v2',
      });
      return;
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      ctx.addIssue({ code: 'custom', message: 'must use http or https' });
    }
  })
  .transform((value) => value.replace(/\/+$/, ''));

/** A comma-separated list, e.g. `CORS_ALLOWED_ORIGINS=https://a.pt,https://b.pt`. */
const csvList = z
  .string()
  .trim()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry !== ''),
  );

const port = z.coerce.number().int().min(1).max(65_535).default(3000);

/**
 * A boolean written the way people write booleans in a `.env`.
 *
 * `undefined` is a third state, not `false`: it means "not configured", which
 * lets a default depend on `NODE_ENV` while still allowing an explicit
 * override. Anything unrecognised is rejected rather than quietly read as
 * `false` — `AUTH_COOKIE_SECURE=ture` must not silently disable a security
 * attribute.
 */
const booleanFlag = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.enum(['true', '1', 'on', 'yes', 'false', '0', 'off', 'no', '']))
  .transform((value) => (value === '' ? undefined : ['true', '1', 'on', 'yes'].includes(value)))
  .optional();

/** Minutes in the environment, milliseconds everywhere else. */
const minutes = (fallback: number, max: number) =>
  z.coerce.number().int().positive().max(max).default(fallback);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: port,
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),

    /** Browser origins allowed to call this service. Empty disables CORS entirely. */
    CORS_ALLOWED_ORIGINS: csvList,

    /**
     * Keys that callers of *this* service must present in `x-api-key`.
     * Deliberately separate from the OfficeGest credential: the front end may
     * hold one of these, and it must never be usable against OfficeGest.
     */
    BACKEND_API_KEYS: csvList,

    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),

    /* --- Sign-in for the private area ------------------------------------ */

    /**
     * Signs the session cookie. Setting it, together with one of the two user
     * sources below, is what turns sign-in on.
     *
     * Rotating it invalidates every session — which is the point: it is the
     * emergency stop for "someone has a cookie they should not have".
     */
    AUTH_SESSION_SECRET: optionalString,

    /** Accounts as inline JSON. Mutually exclusive with `AUTH_USERS_FILE`. */
    AUTH_USERS: optionalString,
    /** Path to the same JSON, absolute or relative to the working directory. */
    AUTH_USERS_FILE: optionalString,

    /** Longest a session may live, however active. Default 8 hours. */
    AUTH_SESSION_TTL_MINUTES: minutes(480, 43_200),
    /** Longest a session may sit unused. Default 1 hour. */
    AUTH_SESSION_IDLE_MINUTES: minutes(60, 43_200),

    /**
     * Left unset on purpose. `auth.config.ts` picks `__Host-fsa_session` when
     * the cookie can carry that prefix — a browser refuses a `__Host-` cookie
     * that is not `Secure`, so a fixed default would work in production and
     * silently store nothing over plain http in development.
     */
    AUTH_COOKIE_NAME: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(value),
        "must be a valid cookie name (letters, digits and ! # $ % & ' * + - . ^ _ ` | ~)",
      )
      .transform((value) => (value === '' ? undefined : value))
      .optional(),
    /**
     * Only for a deployment whose API and site are on different registrable
     * domains. Leave empty: a host-only cookie is narrower, and the `__Host-`
     * prefix on the default name forbids this attribute outright.
     */
    AUTH_COOKIE_DOMAIN: optionalString,
    /**
     * `lax` covers site and API on the same registrable domain, which is every
     * sane deployment. `none` is needed only when they are genuinely
     * cross-site, and then the cookie must also be `Secure`.
     */
    AUTH_COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    /** Defaults to `true` in production. Set `false` only for plain-http local work. */
    AUTH_COOKIE_SECURE: booleanFlag,

    /** Failed attempts, per account and client address, before a lock-out. */
    AUTH_LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().max(100).default(5),
    AUTH_LOGIN_WINDOW_MINUTES: minutes(15, 1_440),
    AUTH_LOGIN_LOCK_MINUTES: minutes(15, 1_440),

    OFFICEGEST_BASE_URL: baseUrl,
    OFFICEGEST_AUTH_MODE: z.enum(OFFICEGEST_AUTH_MODES).default('bearer-login'),
    OFFICEGEST_API_KEY: optionalString,
    OFFICEGEST_USERNAME: optionalString,
    OFFICEGEST_PASSWORD: optionalString,
    OFFICEGEST_TIMEOUT_MS: z.coerce.number().int().positive().max(120_000).default(10_000),
    OFFICEGEST_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  })
  .superRefine((value, ctx) => {
    // Which credential is required depends on the mode, so it cannot be
    // expressed on the fields themselves.
    const password = value.OFFICEGEST_PASSWORD ?? value.OFFICEGEST_API_KEY;

    if (value.OFFICEGEST_AUTH_MODE === 'static-token') {
      if (!value.OFFICEGEST_API_KEY) {
        ctx.addIssue({
          code: 'custom',
          path: ['OFFICEGEST_API_KEY'],
          message: 'is required when OFFICEGEST_AUTH_MODE=static-token',
        });
      }
      return;
    }

    if (!value.OFFICEGEST_USERNAME) {
      ctx.addIssue({
        code: 'custom',
        path: ['OFFICEGEST_USERNAME'],
        message: `is required when OFFICEGEST_AUTH_MODE=${value.OFFICEGEST_AUTH_MODE}`,
      });
    }

    if (!password) {
      ctx.addIssue({
        code: 'custom',
        path: ['OFFICEGEST_PASSWORD'],
        message:
          `is required when OFFICEGEST_AUTH_MODE=${value.OFFICEGEST_AUTH_MODE} ` +
          '(OFFICEGEST_API_KEY is accepted in its place)',
      });
    }
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && value.OFFICEGEST_BASE_URL.startsWith('http://')) {
      ctx.addIssue({
        code: 'custom',
        path: ['OFFICEGEST_BASE_URL'],
        message: 'must use https in production — the credential is sent on every request',
      });
    }
  })
  /**
   * Sign-in is opt-in, and half-configured sign-in is the dangerous state: a
   * secret with no accounts is inert, but accounts with no secret would mean an
   * unsigned session cookie. Every combination is settled here, at startup,
   * rather than at the first sign-in attempt.
   */
  .superRefine((value, ctx) => {
    const hasUsers = Boolean(value.AUTH_USERS ?? value.AUTH_USERS_FILE);

    if (value.AUTH_USERS && value.AUTH_USERS_FILE) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_USERS'],
        message:
          'and AUTH_USERS_FILE are mutually exclusive — set one, so there is no ' +
          'question about which list of accounts is live',
      });
    }

    if (hasUsers && !value.AUTH_SESSION_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_SESSION_SECRET'],
        message:
          'is required when accounts are configured — it signs the session cookie. ' +
          'Generate one with: openssl rand -base64 48',
      });
    }

    // Below the birthday bound for a 256-bit HMAC key there is no point having
    // one at all. The message names the command rather than the rule, because
    // the fix is to generate a secret, not to pad the one already there.
    if (value.AUTH_SESSION_SECRET && value.AUTH_SESSION_SECRET.length < 32) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_SESSION_SECRET'],
        message: 'must be at least 32 characters. Generate one with: openssl rand -base64 48',
      });
    }

    if (value.AUTH_SESSION_SECRET && !hasUsers) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_USERS'],
        message:
          'or AUTH_USERS_FILE is required when AUTH_SESSION_SECRET is set — a secret ' +
          'with no accounts configures a sign-in nobody can complete',
      });
    }

    if (value.AUTH_SESSION_IDLE_MINUTES > value.AUTH_SESSION_TTL_MINUTES) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_SESSION_IDLE_MINUTES'],
        message:
          'must not exceed AUTH_SESSION_TTL_MINUTES — an idle window longer than the ' +
          'session itself is never reached, so it silently does nothing',
      });
    }

    const secureCookie = value.AUTH_COOKIE_SECURE ?? value.NODE_ENV === 'production';

    if (value.AUTH_COOKIE_SAMESITE === 'none' && !secureCookie) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_COOKIE_SAMESITE'],
        message:
          'none requires AUTH_COOKIE_SECURE=true — browsers discard such a cookie ' +
          'silently, which looks like a sign-in that succeeds and then does nothing',
      });
    }

    if (hasUsers && value.NODE_ENV === 'production' && !secureCookie) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_COOKIE_SECURE'],
        message:
          'must not be false in production — the session cookie would travel in clear ' +
          'text, and anyone on the path could replay it',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/**
 * The files `npm run dev` / `npm start` actually load, in order — last wins.
 *
 * Named in the failure message because the commonest cause of "it is set and it
 * still says it is missing" is a value written into `server/.env.example`, which
 * is a committed template and is never loaded by anything.
 */
const ENV_FILES = ['.env', '.env.local', 'server/.env', 'server/.env.local'] as const;

/** Thrown when the process is started with an unusable configuration. */
export class EnvValidationError extends Error {
  override readonly name = 'EnvValidationError';

  constructor(readonly issues: readonly string[]) {
    super(
      `Invalid environment configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}\n\n` +
        `Values are read from, in order (last wins): ${ENV_FILES.join(', ')}\n` +
        'server/.env.example is a template — it is NEVER loaded. Copy it to ' +
        'server/.env and set the values there.',
    );
  }
}

/**
 * Validates a raw environment. Pure, so tests can pin every input instead of
 * mutating `process.env`.
 *
 * @throws {EnvValidationError} with one line per problem — all of them at once,
 * so a misconfigured deploy is fixed in one pass rather than one restart per
 * missing variable.
 */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);

  if (result.success) {
    return result.data;
  }

  // Only the variable name and the reason — never `issue.input`, which for
  // OFFICEGEST_API_KEY would be the credential itself.
  const issues = result.error.issues.map((issue) => {
    const name = issue.path.join('.') || '(root)';
    return `${name} ${issue.message}`;
  });

  throw new EnvValidationError(issues);
}

/** The validated environment for this process. */
export const env: Env = parseEnv(process.env);

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
