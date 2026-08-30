/**
 * The OfficeGest slice of the configuration, shaped for the integration layer.
 *
 * `env.ts` answers "is the environment valid?"; this file answers "what does the
 * OfficeGest client need?". Keeping them apart means the client depends on a
 * small, meaningful type — not on the twelve string variables that produced it —
 * so a test can construct a config object by hand in three lines.
 */
import { env, type OfficeGestAuthMode } from './env.js';

/**
 * The credential, as a discriminated union so the strategy factory is
 * exhaustive: adding a mode makes the compiler point at every place that has to
 * handle it.
 */
export type OfficeGestCredentials =
  | { readonly mode: 'bearer-login'; readonly username: string; readonly password: string }
  | { readonly mode: 'basic'; readonly username: string; readonly password: string }
  | { readonly mode: 'static-token'; readonly token: string };

export interface OfficeGestConfig {
  /** Absolute base URL, no trailing slash — e.g. `https://acme.officegest.com/api/v2`. */
  readonly baseUrl: string;
  readonly credentials: OfficeGestCredentials;
  /** Per-attempt budget. The retry loop may spend this more than once. */
  readonly timeoutMs: number;
  /** Extra attempts after the first, for transient failures only. */
  readonly maxRetries: number;
  /** Identifies this integration in OfficeGest's access logs. */
  readonly userAgent: string;
}

/**
 * Builds the credential union from the flat environment.
 *
 * `OFFICEGEST_API_KEY` doubles as the password for the two credential-pair
 * modes. That is deliberate: OfficeGest issues a dedicated API *user*, and
 * integrators habitually call that user's secret "the API key". Accepting it
 * under either name removes a very common first-run failure.
 */
function resolveCredentials(mode: OfficeGestAuthMode): OfficeGestCredentials {
  if (mode === 'static-token') {
    // `parseEnv` guarantees the key is present in this mode.
    return { mode, token: env.OFFICEGEST_API_KEY as string };
  }

  return {
    mode,
    username: env.OFFICEGEST_USERNAME as string,
    password: (env.OFFICEGEST_PASSWORD ?? env.OFFICEGEST_API_KEY) as string,
  };
}

export const officeGestConfig: OfficeGestConfig = {
  baseUrl: env.OFFICEGEST_BASE_URL,
  credentials: resolveCredentials(env.OFFICEGEST_AUTH_MODE),
  timeoutMs: env.OFFICEGEST_TIMEOUT_MS,
  maxRetries: env.OFFICEGEST_MAX_RETRIES,
  userAgent: 'fsautomotive-officegest-backend/1.0',
};
