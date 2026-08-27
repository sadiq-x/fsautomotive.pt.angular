/**
 * Tests for the build-time environment layer. Run with `npm run test:scripts`.
 *
 * Node's own test runner rather than Vitest: this is build tooling, it runs
 * outside the browser bundle, and the Angular test builder only looks at
 * `src/**\/*.spec.ts`. No dependency, same as the rest of `scripts/`.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  EXPOSED_ENV_VARS,
  buildDefineArgs,
  checkMeasurementId,
  isProductionBuild,
} from './env.mjs';

describe('checkMeasurementId', () => {
  it('accepts a well-formed GA4 id', () => {
    assert.equal(checkMeasurementId('G-ABCD123456', true).level, 'ok');
    assert.equal(checkMeasurementId('g-abcd123456', false).level, 'ok');
  });

  it('tolerates surrounding whitespace', () => {
    assert.equal(checkMeasurementId('  G-ABCD123456  ', true).level, 'ok');
  });

  it('says nothing when unset in development — analytics is simply off', () => {
    assert.equal(checkMeasurementId(undefined, false).level, 'ok');
    assert.equal(checkMeasurementId('', false).level, 'ok');
  });

  it('warns, but does not fail, when a production build has no id', () => {
    const result = checkMeasurementId('', true);

    assert.equal(result.level, 'warn');
    assert.match(result.message, /without analytics/);
  });

  it('fails a production build on a malformed id', () => {
    const result = checkMeasurementId('UA-12345-1', true);

    assert.equal(result.level, 'error');
    assert.match(result.message, /G-ABCD123456/);
  });

  it('rejects the ids that are easiest to paste by mistake', () => {
    // Universal Analytics, a GTM container, the id with its prefix lost, and
    // a prefix with no id behind it.
    for (const wrong of ['UA-12345-1', 'GTM-ABCD123', 'ABCD123456', 'G-']) {
      assert.equal(checkMeasurementId(wrong, true).level, 'error', wrong);
    }
  });

  it('only warns about a malformed id in development', () => {
    const result = checkMeasurementId('UA-12345-1', false);

    assert.equal(result.level, 'warn');
    assert.match(result.message, /disabled/);
  });
});

describe('buildDefineArgs', () => {
  it('quotes values the way esbuild needs', () => {
    const args = buildDefineArgs({ GOOGLE_ANALYTICS_ID: 'G-ABCD123456' });

    assert.deepEqual(args.slice(0, 2), ['--define', 'NG_APP_GOOGLE_ANALYTICS_ID="G-ABCD123456"']);
  });

  it('defines every allow-listed variable, empty when absent', () => {
    const args = buildDefineArgs({});

    assert.equal(args.length, EXPOSED_ENV_VARS.length * 2);
    for (const name of EXPOSED_ENV_VARS) {
      assert.ok(args.includes(`NG_APP_${name}=""`), name);
    }
  });

  it('forwards nothing that is not on the allow-list', () => {
    const args = buildDefineArgs({ AWS_SECRET_ACCESS_KEY: 'hunter2' });

    assert.ok(!args.join(' ').includes('hunter2'));
  });
});

describe('isProductionBuild', () => {
  it('treats a bare build as production — that is angular.json default', () => {
    assert.equal(isProductionBuild(['build']), true);
    assert.equal(isProductionBuild(['build', '--base-href=/fsautomotive.pt.angular/']), true);
  });

  it('recognises every spelling of the development configuration', () => {
    assert.equal(isProductionBuild(['build', '--configuration', 'development']), false);
    assert.equal(isProductionBuild(['build', '--configuration=development']), false);
    assert.equal(isProductionBuild(['build', '-c', 'development']), false);
  });

  it('is never production for serve, which is what npm start uses', () => {
    assert.equal(isProductionBuild(['serve']), false);
  });
});
