/**
 * Whether the development authentication stub is active.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  ▶ TO BROWSE THE PRIVATE AREA WITHOUT AN AUTH BACKEND: set in `.env`
 *
 *      DEV_AUTH_STUB=true
 *
 *    Then sign in at `/private/login` with any e-mail and password.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * WHY THIS CANNOT REACH ANYONE ELSE
 * ---------------------------------
 * A stub that accepts any password is a complete authentication bypass. One
 * runtime check is not enough protection for that, so it is gated twice:
 *
 *  1. `scripts/lib/env.mjs` **fails any build that will be shipped** when the
 *    flag is set — a production build, or one carrying a deploy base href. A
 *    shippable stubbed bundle cannot be produced, so it cannot be deployed.
 *  2. `isDevMode()` here, as a second lock: even a bundle built with the flag
 *    still refuses the stub when running with production optimisations.
 *
 * The two are independent on purpose. Either alone would be a single point of
 * failure for the worst-case mistake in this codebase.
 *
 * Lock 1 tests *publication*, not optimisation, and it has to. `deploy:stub`
 * builds with the development configuration and publishes the result: that
 * bundle is unoptimised, so `isDevMode()` is true and lock 2 opens for it. The
 * audit of 2026-09-14 found that path open — lock 1 was testing
 * `isProductionBuild` alone, which answered the wrong question — so it now
 * refuses anything destined for a public URL whatever compiled it.
 */
import { isDevMode } from '@angular/core';

/** Injected at build time by `scripts/ng-env.mjs`; declared, not imported. */
declare const NG_APP_DEV_AUTH_STUB: string | undefined;

/** The raw `DEV_AUTH_STUB` value, or `''` when unset. */
export const DEV_AUTH_STUB_FLAG: string =
  typeof NG_APP_DEV_AUTH_STUB === 'string' ? NG_APP_DEV_AUTH_STUB.trim() : '';

/**
 * Reads the flag. Kept in step with `isDevAuthStubRequested` in
 * `scripts/lib/env.mjs` — if one changes, change both. A test on each side
 * holds them together.
 */
export function isStubFlagEnabled(flag: string): boolean {
  return ['true', '1', 'on', 'yes'].includes(flag.toLowerCase());
}

/** Both locks. Production builds are `false` whatever `.env` says. */
export function isDevAuthStubActive(): boolean {
  return isStubFlagEnabled(DEV_AUTH_STUB_FLAG) && isDevMode();
}
