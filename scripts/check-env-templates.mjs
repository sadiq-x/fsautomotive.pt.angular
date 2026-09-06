#!/usr/bin/env node
/**
 * Fails the build when a committed `.env.example` carries a real value.
 *
 *   npm run check:env-templates
 *
 * See `scripts/lib/env-templates.mjs` for why this exists as a check rather
 * than as a comment in the templates.
 */
import { readFile } from 'node:fs/promises';
import { findTemplateSecrets } from './lib/env-templates.mjs';

const TEMPLATES = ['.env.example', 'server/.env.example'];

const issues = [];

for (const file of TEMPLATES) {
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
