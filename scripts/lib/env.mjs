/**
 * The pure half of `scripts/ng-env.mjs`: which environment variables reach the
 * browser bundle, and whether their values are usable.
 *
 * Split out from the runner so it can be tested without spawning the Angular
 * CLI — see `env.test.mjs`, run by `npm run test:scripts`.
 */

/**
 * Environment variables that may be compiled into the browser bundle.
 * Each is exposed to the source as `NG_APP_<NAME>`; the prefix marks a value
 * as build-injected and publicly readable.
 *
 * This is an allow-list, not a filter on `process.env`, so a secret added to
 * `.env` can never leak into the bundle by accident.
 */
export const EXPOSED_ENV_VARS = [
  'GOOGLE_ANALYTICS_ID',
  'GOOGLE_ANALYTICS_ENABLED',
  'API_BASE_URL',
  'DEV_AUTH_STUB',
];

/** Only these Angular commands accept the `define` build option. */
export const COMMANDS_ACCEPTING_DEFINE = new Set(['build', 'serve']);

/**
 * A GA4 Measurement ID. Kept in step with `isMeasurementIdConfigured` in
 * `src/app/core/config/analytics.config.ts` — if one changes, change both.
 */
const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/i;

/**
 * Checks the Measurement ID and reports what the build should do about it.
 *
 * The three outcomes exist because the cost of a mistake differs by
 * environment. A typo that ships to production means weeks of silently missing
 * data, so that fails the build. The same typo locally should not stop a
 * developer who is working on something else, so it warns and runs on without
 * analytics. An empty value is a deliberate "analytics off" and says nothing.
 *
 * @param {string | undefined} id Raw `GOOGLE_ANALYTICS_ID` value.
 * @param {boolean} isProduction Whether this build ships.
 * @returns {{ level: 'ok' | 'warn' | 'error', message?: string }}
 */
export function checkMeasurementId(id, isProduction) {
  const value = (id ?? '').trim();

  if (value === '') {
    return isProduction
      ? {
          level: 'warn',
          message:
            'GOOGLE_ANALYTICS_ID is not set — this production build will ship without analytics.\n' +
            'Set it in .env (see .env.example) if that is not intended.',
        }
      : { level: 'ok' };
  }

  if (!MEASUREMENT_ID_PATTERN.test(value)) {
    const message =
      `GOOGLE_ANALYTICS_ID is malformed: ${JSON.stringify(value)}\n` +
      'Expected a GA4 Measurement ID like "G-ABCD123456" (Google Analytics → ' +
      'Admin → Data Streams → your web stream).\n' +
      'A Universal Analytics id ("UA-…") or a container id ("GTM-…") will not work.';

    return isProduction
      ? { level: 'error', message }
      : { level: 'warn', message: `${message}\nAnalytics is disabled for this development build.` };
  }

  return { level: 'ok' };
}

/**
 * Whether the development authentication stub has been asked for.
 *
 * Kept in step with `isStubFlagEnabled` in
 * `src/app/core/config/auth.config.ts` — if one changes, change both.
 *
 * @param {string | undefined} flag Raw `DEV_AUTH_STUB` value.
 */
export function isDevAuthStubRequested(flag) {
  return ['true', '1', 'on', 'yes'].includes((flag ?? '').trim().toLowerCase());
}

/**
 * Refuses to build a shipping bundle with the authentication stub enabled.
 *
 * This is the outer of the two locks on the stub (the inner one is
 * `isDevMode()` at runtime). It matters more than the usual "don't ship debug
 * code" rule, because the stub accepts *any* password: a bundle built with it
 * is a complete authentication bypass. Failing the build means such a bundle
 * cannot be produced, so it cannot be deployed by accident.
 *
 * @param {string | undefined} flag Raw `DEV_AUTH_STUB` value.
 * @param {boolean} isProduction Whether this build ships.
 * @returns {{ level: 'ok' | 'warn' | 'error', message?: string }}
 */
export function checkDevAuthStub(flag, isProduction) {
  if (!isDevAuthStubRequested(flag)) {
    return { level: 'ok' };
  }

  if (isProduction) {
    return {
      level: 'error',
      message:
        'DEV_AUTH_STUB is enabled and this is a production build.\n' +
        'The stub accepts ANY password — shipping it would leave the management ' +
        'area completely unprotected.\n' +
        'Unset DEV_AUTH_STUB in .env (or .env.local) before building for production.',
    };
  }

  return {
    level: 'warn',
    message:
      'DEV_AUTH_STUB is enabled: any password will be accepted at /gestao/entrar.\n' +
      'This build must never be deployed.',
  };
}

/**
 * Builds the `--define` flags for the Angular CLI.
 *
 * A variable absent from the environment is still defined, as `''`. Defining it
 * is what lets the app read it: without a `define`, the identifier in the
 * source stays undeclared and only the `typeof` guard keeps it from throwing.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {string[]} Flat `['--define', 'NG_APP_X="y"', …]` argument list.
 */
export function buildDefineArgs(env) {
  return EXPOSED_ENV_VARS.flatMap((name) => [
    '--define',
    // JSON.stringify supplies the quotes esbuild needs around a string
    // literal, and escapes anything awkward in the value.
    `NG_APP_${name}=${JSON.stringify(env[name] ?? '')}`,
  ]);
}

/**
 * Whether an Angular CLI invocation produces a shipping bundle.
 *
 * `build` defaults to the production configuration in this project
 * (`defaultConfiguration` in angular.json), so the check is "is this a build
 * that was not explicitly switched to development".
 *
 * @param {string[]} argv Arguments passed to the CLI, without the node binary.
 */
export function isProductionBuild(argv) {
  if (argv[0] !== 'build') {
    return false;
  }

  const configuration = readConfiguration(argv);
  return configuration === undefined || configuration === 'production';
}

/** Reads `--configuration <name>` / `--configuration=<name>` / `-c <name>`. */
function readConfiguration(argv) {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith('--configuration=')) {
      return arg.slice('--configuration='.length);
    }
    if (arg === '--configuration' || arg === '-c') {
      return argv[i + 1];
    }
  }

  return undefined;
}
