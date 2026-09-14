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
 * WHY THE TEST IS "SHIPPING" AND NOT "PRODUCTION"
 * ----------------------------------------------
 * It used to be `isProductionBuild` alone, and that left a hole:
 * `build:ghpages:stub` passes `--configuration development`, so the build was
 * not "production", the check softened to a warning, and `deploy:stub` pushed a
 * bundle with the stub in it to a public URL. Optimisation level is not what
 * makes a build dangerous — publication is. Anything that will be served to
 * strangers is refused, whichever configuration produced it.
 *
 * @param {string | undefined} flag Raw `DEV_AUTH_STUB` value.
 * @param {boolean} isShipping Whether this bundle will be served to anyone but
 *   the developer who built it — see `isProductionBuild` and `isPublishedBuild`.
 * @returns {{ level: 'ok' | 'warn' | 'error', message?: string }}
 */
export function checkDevAuthStub(flag, isShipping) {
  if (!isDevAuthStubRequested(flag)) {
    return { level: 'ok' };
  }

  if (isShipping) {
    return {
      level: 'error',
      message:
        'DEV_AUTH_STUB is enabled and this build would be shipped.\n' +
        'The stub accepts ANY password — publishing it would leave the management ' +
        'area completely unprotected.\n' +
        'A development configuration does not make this safe: a bundle carrying a ' +
        'deploy base href is served to the public whatever it was compiled with.\n' +
        'Unset DEV_AUTH_STUB in .env (or .env.local) before building to deploy.',
    };
  }

  return {
    level: 'warn',
    message:
      'DEV_AUTH_STUB is enabled: any password will be accepted at /private/login.\n' +
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

/**
 * The origins `connect-src` allows, read out of `src/index.html`.
 *
 * The policy lives in the HTML because the site is served as static files and
 * nothing can set a header (see the comment on the tag itself). That makes the
 * tag the single source of truth, and this the only reader of it — rather than
 * a second copy of the origin list kept in sync by hand.
 *
 * @param {string} indexHtml Contents of `src/index.html`.
 * @returns {string[]} Origins and keywords, e.g. `["'self'", 'http://localhost:3000']`.
 */
export function readConnectSrcOrigins(indexHtml) {
  const policy = /http-equiv="Content-Security-Policy"[\s\S]*?content="([\s\S]*?)"/.exec(indexHtml);

  if (!policy) {
    return [];
  }

  const directive = policy[1]
    .split(';')
    .map((entry) => entry.trim().replace(/\s+/g, ' '))
    .find((entry) => entry.startsWith('connect-src '));

  return directive ? directive.slice('connect-src '.length).split(' ').filter(Boolean) : [];
}

/**
 * Refuses a build whose backend origin the page would not be allowed to call.
 *
 * `API_BASE_URL` and the `connect-src` list are two statements of the same
 * fact, and they are edited in different files. When they disagree the bundle
 * builds, deploys and loads perfectly — and then every request from the private
 * area is blocked by the browser, with nothing in the server log to explain it.
 * That is a bad afternoon, and it is entirely preventable here.
 *
 * An empty `API_BASE_URL` means "same origin as the page", which `'self'`
 * already covers, so it needs no entry.
 *
 * @param {string | undefined} apiBaseUrl Raw `API_BASE_URL` value.
 * @param {string} indexHtml Contents of `src/index.html`.
 * @returns {{ level: 'ok' | 'warn' | 'error', message?: string }}
 */
export function checkApiOriginAllowed(apiBaseUrl, indexHtml) {
  const value = (apiBaseUrl ?? '').trim();

  if (value === '') {
    return { level: 'ok' };
  }

  let origin;

  try {
    origin = new URL(value).origin;
  } catch {
    return {
      level: 'error',
      message:
        `API_BASE_URL is not an absolute URL: ${JSON.stringify(value)}\n` +
        'Expected something like https://api.fsautomotive.pt, or empty to call ' +
        'the same origin the site is served from.',
    };
  }

  const allowed = readConnectSrcOrigins(indexHtml);

  if (allowed.length === 0) {
    return {
      level: 'warn',
      message:
        'Could not read connect-src from src/index.html, so the backend origin ' +
        'was not checked against the Content Security Policy.',
    };
  }

  if (allowed.includes(origin)) {
    return { level: 'ok' };
  }

  return {
    level: 'error',
    message:
      `API_BASE_URL points at ${origin}, which the Content Security Policy in ` +
      'src/index.html does not allow.\n' +
      `connect-src currently permits: ${allowed.join(' ')}\n` +
      'The browser would block every request to the backend, so the private area ' +
      'would load and then fail to fetch anything.\n' +
      `Add ${origin} to the connect-src directive, or correct API_BASE_URL.`,
  };
}

/** The flag the deploy builds carry; see `isPublishedBuild`. */
const BASE_HREF_FLAG = '--base-href';

/**
 * Whether this build produces a bundle that will be served to the public.
 *
 * A base href is only needed when the app is served from somewhere other than
 * the root of a domain, which in this project means exactly one thing: the
 * GitHub Pages site. Both `build:ghpages` and `build:ghpages:stub` pass it, and
 * nothing else does — so its presence is a reliable "this is going to be
 * published" marker, available at the only moment a check can still refuse.
 *
 * This is deliberately independent of `--configuration`. `deploy:stub` builds
 * with the development configuration and publishes the result, so asking only
 * whether the build was optimised answered the wrong question.
 *
 * @param {string[]} argv Arguments passed to the CLI, without the node binary.
 */
export function isPublishedBuild(argv) {
  if (argv[0] !== 'build') {
    return false;
  }

  return argv.some((arg) => arg === BASE_HREF_FLAG || arg.startsWith(`${BASE_HREF_FLAG}=`));
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
