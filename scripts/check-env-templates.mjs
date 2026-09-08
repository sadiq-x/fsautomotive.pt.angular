#!/usr/bin/env node
/**
 * Fails the build when a committed `.env.example` carries a real value.
 *
 *   npm run check:env-templates
 *
 * See `scripts/lib/env-templates.mjs` for why this exists as a check rather
 * than as a comment in the templates.
 */
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { findTemplateSecrets } from './lib/env-templates.mjs';

const TEMPLATES = ['.env.example', 'server/.env.example'];

/**
 * Whether git is tracking a path.
 *
 * The check is about what gets *published*, so an untracked template is out of
 * scope: `server/.env.example` is deliberately gitignored, and flagging a local
 * scratch file as "a committed template contains a real value" would be both
 * wrong and the kind of false alarm that teaches people to ignore the guard.
 *
 * If git is unavailable the answer is "yes" — checking a file that turns out not
 * to be committed is a harmless extra check; skipping one that is, is not.
 */
function isTracked(file) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', file], { stdio: 'ignore' });
    return true;
  } catch (error) {
    return error.code === 'ENOENT';
  }
}

const issues = [];

for (const file of TEMPLATES) {
  if (!isTracked(file)) {
    console.log(`[env-templates] ${file} is not tracked by git — skipped.`);
    continue;
  }

  let contents;

  try {
    contents = await readFile(file, 'utf8');
  } catch {
    // A template that does not exist is not this check's problem.
    continue;
  }

  issues.push(...findTemplateSecrets(contents, file));
}

if (issues.length > 0) {
  console.error('\n[env-templates] A committed template contains a real value:\n');
  for (const issue of issues) {
    console.error(`  - ${issue}`);
  }
  console.error(
    '\nThese files are committed. The working values belong in `.env` / `server/.env`,\n' +
      'which are gitignored — and which are the only files anything actually loads.\n',
  );
  process.exit(1);
}

console.log('[env-templates] ok — no real values in the committed templates.');
