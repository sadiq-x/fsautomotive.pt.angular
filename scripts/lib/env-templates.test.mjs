/**
 * Tests for the committed-template guard. Run with `npm run test:scripts`.
 *
 * The check exists because a live OfficeGest credential reached a public commit
 * through `server/.env.example`, so the cases that matter most are the ones
 * that must FAIL: a quoted value, a bare value, and a value that looks
 * plausible. A guard that misses one of those is worse than none, because it
 * implies the file was checked.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SECRET_TEMPLATE_VARS, findTemplateSecrets } from './env-templates.mjs';

const clean = (contents) => findTemplateSecrets(contents, 'server/.env.example');

describe('findTemplateSecrets', () => {
  it('passes a template whose secret slots are empty', () => {
    assert.deepEqual(
      clean('OFFICEGEST_API_KEY=\nOFFICEGEST_USERNAME=\nOFFICEGEST_BASE_URL=\n'),
      [],
    );
  });

  it('catches a bare value', () => {
    const issues = clean('OFFICEGEST_API_KEY=14217|c102beb0\n');

    assert.equal(issues.length, 1);
    assert.match(issues[0], /server\/\.env\.example:1 OFFICEGEST_API_KEY/);
  });

  it('catches a quoted value, single or double', () => {
    assert.equal(clean('OFFICEGEST_PASSWORD="API20262026"\n').length, 1);
    assert.equal(clean("OFFICEGEST_PASSWORD='API20262026'\n").length, 1);
  });

  it('catches a username, which identifies the tenant even without the secret', () => {
    assert.equal(clean('OFFICEGEST_USERNAME="DES@DES"\n').length, 1);
  });

  /** The value is the thing being protected; it must not be echoed to report it. */
  it('never repeats the offending value in its message', () => {
    const issues = clean('OFFICEGEST_API_KEY="super-secret-value"\n');

    assert.equal(issues.length, 1);
    assert.ok(!issues[0].includes('super-secret-value'));
  });

  it('reports the line number, so the fix is one jump away', () => {
    const issues = clean('# comment\n\nOFFICEGEST_API_KEY=live-value\n');

    assert.match(issues[0], /:3 /);
  });

  it('ignores a commented-out line, which documents rather than configures', () => {
    assert.deepEqual(clean('# OFFICEGEST_API_KEY=example-only\n'), []);
    assert.deepEqual(clean('  #OFFICEGEST_PASSWORD=nope\n'), []);
  });

  it('allows an obvious placeholder, so a template can still show the shape', () => {
    assert.deepEqual(
      clean('OFFICEGEST_BASE_URL="https://YOUR-COMPANY.officegest.com/api/v2"\n'),
      [],
    );
    assert.deepEqual(clean('OFFICEGEST_API_KEY=changeme\n'), []);
  });

  it('ignores variables that are not secrets', () => {
    assert.deepEqual(clean('PORT=3000\nLOG_LEVEL=info\nNODE_ENV=development\n'), []);
  });

  it('reports every offending line at once, not just the first', () => {
    const issues = clean(
      'OFFICEGEST_API_KEY=a\nOFFICEGEST_PASSWORD=b\nOFFICEGEST_USERNAME=c\nPORT=3000\n',
    );

    assert.equal(issues.length, 3);
  });

  it('guards the backend key too — it opens this API, if not the ERP', () => {
    assert.ok(SECRET_TEMPLATE_VARS.includes('BACKEND_API_KEYS'));
    assert.equal(clean('BACKEND_API_KEYS=live-key-1,live-key-2\n').length, 1);
  });
});
