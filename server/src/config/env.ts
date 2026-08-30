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
  });

export type Env = z.infer<typeof envSchema>;

/** Thrown when the process is started with an unusable configuration. */
export class EnvValidationError extends Error {
  override readonly name = 'EnvValidationError';

  constructor(readonly issues: readonly string[]) {
    super(
      `Invalid environment configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}\n\n` +
        'See server/.env.example for the full list of variables.',
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
