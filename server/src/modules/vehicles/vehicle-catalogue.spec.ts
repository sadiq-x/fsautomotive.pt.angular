/**
 * The reference-table cache.
 *
 * What is worth pinning here is not "it returns names" but the three things
 * that would quietly regress: that it does not re-fetch, that concurrent
 * callers share one fetch, and that a failure degrades instead of propagating.
 */
import { describe, expect, it, vi } from 'vitest';

import type { VehicleCatalogueResource } from '../../integrations/officegest/index.js';
import { logger as sharedLogger, type Logger } from '../../shared/logger.js';
import { VehicleCatalogue } from './vehicle-catalogue.js';

const silentLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
} satisfies Record<string, unknown> as unknown as Logger;

function makeResource(overrides: Partial<VehicleCatalogueResource> = {}) {
  return {
    listFuels: vi.fn().mockResolvedValue({ items: [{ id: 17, name: 'Diesel' }], meta: {} }),
    listBrands: vi.fn().mockResolvedValue({ items: [{ id: 42, name: 'Renault' }], meta: {} }),
    getVersion: vi.fn().mockResolvedValue({ id: 900, name: '1.5 dCi' }),
    ...overrides,
  };
}

describe('VehicleCatalogue', () => {
  it('reads the tables once and serves the rest from cache', async () => {
    const resource = makeResource();
    const catalogue = new VehicleCatalogue(resource as unknown as VehicleCatalogueResource);

    const first = await catalogue.tables(silentLogger);
    await catalogue.tables(silentLogger);
    await catalogue.tables(silentLogger);

    expect(resource.listFuels).toHaveBeenCalledTimes(1);
    expect(first.fuels.get(17)).toBe('Diesel');
    expect(first.brands.get(42)).toBe('Renault');
  });

  /**
   * The case that matters under load: ten requests arriving before the first
   * fetch resolves must not become ten fetches.
   */
  it('shares one fetch between callers that arrive together', async () => {
    const resource = makeResource();
    const catalogue = new VehicleCatalogue(resource as unknown as VehicleCatalogueResource);

    await Promise.all(Array.from({ length: 10 }, () => catalogue.tables(silentLogger)));

    expect(resource.listFuels).toHaveBeenCalledTimes(1);
    expect(resource.listBrands).toHaveBeenCalledTimes(1);
  });

  it('fetches again once the entry has expired', async () => {
    const resource = makeResource();
    let now = 0;
    const catalogue = new VehicleCatalogue(
      resource as unknown as VehicleCatalogueResource,
      () => now,
    );

    await catalogue.tables(silentLogger);
    now = 7 * 60 * 60 * 1000;
    await catalogue.tables(silentLogger);

    expect(resource.listFuels).toHaveBeenCalledTimes(2);
  });

  it('degrades to no names when the tables cannot be read, and retries next time', async () => {
    const listFuels = vi
      .fn()
      .mockRejectedValueOnce(new Error('403'))
      .mockResolvedValue({ items: [{ id: 17, name: 'Diesel' }], meta: {} });
    const resource = makeResource({ listFuels } as Partial<VehicleCatalogueResource>);
    const catalogue = new VehicleCatalogue(resource as unknown as VehicleCatalogueResource);

    const failed = await catalogue.tables(silentLogger);
    expect(failed.fuels.size).toBe(0);

    // A failure is not cached, so the next caller gets a real attempt.
    const recovered = await catalogue.tables(silentLogger);
    expect(recovered.fuels.get(17)).toBe('Diesel');
  });

  /**
   * On the shared logger, not the caller's: the load is triggered by whichever
   * request arrives first and read by all the rest, so it belongs to none of
   * them in particular.
   */
  it('warns when a reference table outgrows a single request', async () => {
    const warn = vi.spyOn(sharedLogger, 'warn').mockImplementation(() => undefined);
    const resource = makeResource({
      listBrands: vi.fn().mockResolvedValue({ items: [], meta: { has_more: true } }),
    } as Partial<VehicleCatalogueResource>);

    try {
      await new VehicleCatalogue(resource as unknown as VehicleCatalogueResource).tables(
        silentLogger,
      );

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('no longer fits'), {
        table: 'brands',
      });
    } finally {
      warn.mockRestore();
    }
  });

  it('skips rows that carry no id or no name', async () => {
    const resource = makeResource({
      listFuels: vi.fn().mockResolvedValue({
        items: [{ id: 17, name: 'Diesel' }, { id: 18 }, { name: 'orphan' }, {}],
        meta: {},
      }),
    } as Partial<VehicleCatalogueResource>);

    const tables = await new VehicleCatalogue(
      resource as unknown as VehicleCatalogueResource,
    ).tables(silentLogger);

    expect([...tables.fuels.keys()]).toEqual([17]);
  });

  describe('versionName', () => {
    it('reads a version once, including when it has no name', async () => {
      const getVersion = vi.fn().mockResolvedValue({ id: 900 });
      const resource = makeResource({ getVersion } as Partial<VehicleCatalogueResource>);
      const catalogue = new VehicleCatalogue(resource as unknown as VehicleCatalogueResource);

      expect(await catalogue.versionName(900, silentLogger)).toBeUndefined();
      expect(await catalogue.versionName(900, silentLogger)).toBeUndefined();

      expect(getVersion).toHaveBeenCalledTimes(1);
    });

    /** Unlike a nameless version, a failure is worth trying again. */
    it('does not cache a failure', async () => {
      const getVersion = vi
        .fn()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValue({ id: 900, name: '1.5 dCi' });
      const resource = makeResource({ getVersion } as Partial<VehicleCatalogueResource>);
      const catalogue = new VehicleCatalogue(resource as unknown as VehicleCatalogueResource);

      expect(await catalogue.versionName(900, silentLogger)).toBeUndefined();
      expect(await catalogue.versionName(900, silentLogger)).toBe('1.5 dCi');
    });
  });
});
