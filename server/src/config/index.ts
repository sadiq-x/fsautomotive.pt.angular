/**
 * The application configuration object.
 *
 * Everything outside `config/` imports from here, never from `env.ts` directly,
 * so `config.officegest.baseUrl` is the only shape callers learn. Swapping the
 * source of a value — a file, a secrets manager — stays a change inside this
 * folder.
 */
import { loadAuthConfig, type AuthConfig } from './auth.config.js';
import { env } from './env.js';
import { officeGestConfig, type OfficeGestConfig } from './officegest.config.js';

export interface AppConfig {
  readonly env: 'development' | 'test' | 'production';
  readonly isProduction: boolean;
  readonly port: number;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  readonly cors: { readonly allowedOrigins: readonly string[] };
  /** Keys accepted by this service's own `x-api-key` guard. Empty = guard off. */
  readonly apiKeys: readonly string[];
  readonly rateLimit: { readonly windowMs: number; readonly maxRequests: number };
  readonly officegest: OfficeGestConfig;
  /** Sign-in for the private area. `enabled` is false when no accounts are set. */
  readonly auth: AuthConfig;
}

export const config: AppConfig = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  logLevel: env.LOG_LEVEL,
  cors: { allowedOrigins: env.CORS_ALLOWED_ORIGINS },
  apiKeys: env.BACKEND_API_KEYS,
  rateLimit: { windowMs: env.RATE_LIMIT_WINDOW_MS, maxRequests: env.RATE_LIMIT_MAX_REQUESTS },
  officegest: officeGestConfig,
  /**
   * A getter, because the account list is read from disk and may be rejected.
   * Building it here, while this module is evaluated, would put that failure
   * beyond the reach of `server.ts`'s error handling — see `loadAuthConfig`.
   * It is memoised, so this is one call, not one file read per access.
   */
  get auth(): AuthConfig {
    return loadAuthConfig();
  },
};

export { EnvValidationError, parseEnv, OFFICEGEST_AUTH_MODES } from './env.js';
export type { Env, OfficeGestAuthMode } from './env.js';
export { AuthConfigError } from './auth.config.js';
export type { AuthConfig, AuthCookieConfig } from './auth.config.js';
export type { OfficeGestConfig, OfficeGestCredentials } from './officegest.config.js';
