#!/usr/bin/env node
/**
 * Runs the Angular CLI with values from `.env` injected as build-time constants.
 *
 * WHY THIS EXISTS
 * ---------------
 * The site is browser-only — there is no server process at runtime, so nothing
 * can read a `.env` file when a visitor loads the page. Any configuration has
 * to be baked in when the bundle is built. esbuild (via Angular's `define`
 * build option) does exactly that: it replaces a bare identifier in the source
 * with a literal at compile time.
 *
 * Node loads the env files itself — `--env-file-if-exists` in the npm scripts,
 * `.env` then `.env.local` — so there is no dotenv dependency. This runner
 * reads the resulting `process.env` and forwards the allow-listed values on as
 * `--define` flags.
 *
 * SECURITY
 * --------
 * Everything defined here is compiled into JavaScript that anyone can read in
 * the browser. That is why variables are exposed through an explicit allow-list
 * rather than by forwarding `process.env` wholesale: a secret accidentally
 * added to `.env` can never leak into the bundle by default.
 *
 * A GA4 Measurement ID is *not* a secret — it is visible in the page source of
 * every site that uses Analytics. It lives in `.env` for configuration
 * management (different value per environment, not committed), not secrecy.
 *
 * USAGE
 * -----
 *   node --env-file-if-exists=.env --env-file-if-exists=.env.local \
 *        scripts/ng-env.mjs build
 *
 * Commands other than `build`/`serve` are passed straight through, because
 * only those two builders accept `--define`.
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import {
  COMMANDS_ACCEPTING_DEFINE,
  buildDefineArgs,
  checkApiOriginAllowed,
  checkDevAuthStub,
  checkMeasurementId,
  isProductionBuild,
  isPublishedBuild,
} from './lib/env.mjs';

const argv = process.argv.slice(2);
const command = argv[0];

const defines = COMMANDS_ACCEPTING_DEFINE.has(command) ? buildDefineArgs(process.env) : [];

// Validate before spawning anything. A malformed id fails a production build
// rather than shipping a site that reports nothing: the failure is silent in
// the browser, so this is the only place it can be caught.
if (COMMANDS_ACCEPTING_DEFINE.has(command)) {
  const isProduction = isProductionBuild(argv);

  const checks = [
    checkMeasurementId(process.env['GOOGLE_ANALYTICS_ID'], isProduction),
    // The authentication stub accepts any password, so the test is "will anyone
    // but this developer load it?" — not "was it optimised?". A deploy build
    // published from the development configuration is the case that matters:
    // it is unoptimised, so `isProductionBuild` says no, and it still lands on
    // a public URL.
    checkDevAuthStub(process.env['DEV_AUTH_STUB'], isProduction || isPublishedBuild(argv)),
    // The Content Security Policy is written in the HTML, and the backend origin
    // in `.env`. They have to agree, and the failure when they do not is silent
    // in the browser — so it is caught here instead.
    checkApiOriginAllowed(process.env['API_BASE_URL'], readIndexHtml()),
  ];

  for (const check of checks) {
    if (check.level === 'error') {
      console.error(`\n[ng-env] ${check.message}\n`);
      process.exit(1);
    }
    if (check.level === 'warn') {
      console.warn(`\n[ng-env] ${check.message}\n`);
    }
  }
}

/** `src/index.html`, or an empty string if it cannot be read. */
function readIndexHtml() {
  try {
    return readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
  } catch {
    // The check downgrades itself to a warning on an empty document, which is
    // the right outcome: a missing index.html fails the build moments later,
    // with a far better message than anything this could produce.
    return '';
  }
}

// Spawn the CLI's JS entry point through the current Node binary rather than
// the `ng` shim: no shell quoting, and identical behaviour on Windows.
const ngEntryPoint = createRequire(import.meta.url).resolve('@angular/cli/bin/ng.js');

const child = spawn(process.execPath, [ngEntryPoint, ...argv, ...defines], { stdio: 'inherit' });

child.on('error', (error) => {
  console.error(`Failed to start the Angular CLI: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  // Preserve the CLI's own exit code so npm, CI and deploy.ps1 all see failure.
  process.exit(signal ? 1 : (code ?? 1));
});
