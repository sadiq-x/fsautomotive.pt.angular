/**
 * Google Analytics 4 configuration.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  ▶ TO ENABLE ANALYTICS: set `GOOGLE_ANALYTICS_ID` in `.env` (see `.env.example`)
 *
 *      GOOGLE_ANALYTICS_ID=G-ABCD123456
 *
 *    Take the value from Google Analytics → Admin → Data Streams → your web
 *    stream. Restart `npm start` afterwards: it is a build-time constant.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The site is browser-only, so `.env` cannot be read at runtime. The value is
 * compiled in by `scripts/ng-env.mjs`, which forwards allow-listed variables to
 * the Angular CLI's `--define` option. That replaces the identifiers below with
 * string literals during the build, and refuses a production build outright if
 * the ID is present but malformed.
 *
 * Until it is set, analytics is completely inert: no script is loaded, no
 * request is made, no listener is attached.
 */
import { InjectionToken, isDevMode } from '@angular/core';

import type { AnalyticsConfig } from '../models';

/**
 * Injected at build time by `scripts/ng-env.mjs`. They are declared, not
 * imported — the identifiers exist only after esbuild substitutes them.
 */
declare const NG_APP_GOOGLE_ANALYTICS_ID: string | undefined;
declare const NG_APP_GOOGLE_ANALYTICS_ENABLED: string | undefined;

/** The configured GA4 Measurement ID, or an empty string when unset. */
export const GA_MEASUREMENT_ID: string =
  typeof NG_APP_GOOGLE_ANALYTICS_ID === 'string' ? NG_APP_GOOGLE_ANALYTICS_ID.trim() : '';

/** The raw `GOOGLE_ANALYTICS_ENABLED` override, or `''` when unset. */
export const GA_ENABLED_FLAG: string =
  typeof NG_APP_GOOGLE_ANALYTICS_ENABLED === 'string' ? NG_APP_GOOGLE_ANALYTICS_ENABLED.trim() : '';

/**
 * A Measurement ID is usable only if it is present and well-formed.
 * The same rule gates the production build in `scripts/lib/env.mjs`; the two
 * are kept in step by a test on each side.
 */
export function isMeasurementIdConfigured(id: string): boolean {
  return /^G-[A-Z0-9]{4,}$/i.test(id);
}

/**
 * Interprets the optional `GOOGLE_ANALYTICS_ENABLED` kill switch.
 *
 * Unset means "follow the Measurement ID", which is the common case. An
 * explicit `false`/`0`/`off`/`no` turns analytics off even though an ID is
 * present — the point being a staging build that shares one `.env` with
 * production but must not report into it.
 */
export function isEnabledByFlag(flag: string): boolean {
  return !['false', '0', 'off', 'no'].includes(flag.toLowerCase());
}

/**
 * Resolves the settings the service runs on. Pure, so tests can pin every
 * input instead of reaching for the build environment.
 */
export function buildAnalyticsConfig(
  measurementId: string,
  enabledFlag: string,
  debug: boolean,
): AnalyticsConfig {
  return {
    measurementId,
    enabled: isMeasurementIdConfigured(measurementId) && isEnabledByFlag(enabledFlag),
    debug,
    sendPageView: false,
  };
}

/**
 * The settings `AnalyticsService` runs on, behind a token so tests can supply
 * their own. Production callers never provide it — the factory reads the
 * build-injected constants above.
 */
export const ANALYTICS_CONFIG = new InjectionToken<AnalyticsConfig>('ANALYTICS_CONFIG', {
  providedIn: 'root',
  factory: () => buildAnalyticsConfig(GA_MEASUREMENT_ID, GA_ENABLED_FLAG, isDevMode()),
});
