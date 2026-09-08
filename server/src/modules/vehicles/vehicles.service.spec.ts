/**
 * Vehicle use cases, against a stubbed resource.
 *
 * Most of these pin decisions that were made from evidence gathered against the
 * live tenant on 2026-09-08, and that a future refactor could plausibly undo:
 * the plate form sent upstream, the ordering, and the fact that a reference
 * table failing must not fail the page.
 */
import { describe, expect, it, vi } from 'vitest';

import type {
  VehicleCatalogueResource,
  VehiclesResource,
} from '../../integrations/officegest/index.js';
import type { Logger } from '../../shared/logger.js';
import { VehicleCatalogue } from './vehicle-catalogue.js';
import { VehiclesService } from './vehicles.service.js';

const silentLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
} satisfies Record<string, unknown> as unknown as Logger;

const context = { logger: silentLogger };

const FUELS = { items: [{ id: 17, name: 'Diesel' }], meta: {} };
const BRANDS = { items: [{ id: 42, name: 'Renault' }], meta: {} };

function makeCatalogue(overrides: Partial<VehicleCatalogueResource> = {}): VehicleCatalogue {
  return new VehicleCatalogue({
    listFuels: vi.fn().mockResolvedValue(FUELS),
    listBrands: vi.fn().mockResolvedValue(BRANDS),
    getVersion: vi.fn().mockResolvedValue({ id: 900, name: '1.5 dCi' }),
    ...overrides,
  } as unknown as VehicleCatalogueResource);
}

function makeResource(overrides: Partial<VehiclesResource> = {}): VehiclesResource {
  return {
    list: vi.fn().mockResolvedValue({ items: [], meta: {} }),
    getByPlate: vi.fn().mockResolvedValue({ plate: '00-00-ZZ' }),
    ...overrides,
  } as unknown as VehiclesResource;
}

function makeService(
  resource: VehiclesResource = makeResource(),
  catalogue: VehicleCatalogue = makeCatalogue(),
): VehiclesService {
  return new VehiclesService(resource, catalogue);
}

describe('VehiclesService', () => {
  describe('getByPlate', () => {
    /**
     * The regression that made every vehicle detail page report "not found":
     * OfficeGest 404s on `0000ZZ` and returns the record for `00-00-ZZ`.
     */
    it('addresses the vehicle by its hyphenated plate', async () => {
      const resource = makeResource();

      await makeService(resource).getByPlate('0000zz', context);

      expect(resource.getByPlate).toHaveBeenCalledWith('00-00-ZZ', expect.anything());
    });

    it('publishes the normalised plate whatever the caller typed', async () => {
      const vehicle = await makeService().getByPlate('00-00-zz', context);

      expect(vehicle.plate).toBe('0000ZZ');
    });

    it('resolves the fuel, brand and version names, and drops their ids', async () => {
      const resource = makeResource({
        getByPlate: vi.fn().mockResolvedValue({
          plate: '00-00-ZZ',
          fuel_id: 17,
          brand_id: 42,
          version_id: 900,
        }),
      });

      const vehicle = await makeService(resource).getByPlate('0000ZZ', context);

      expect(vehicle).toMatchObject({ fuel: 'Diesel', brand: 'Renault', version: '1.5 dCi' });
      expect(vehicle).not.toHaveProperty('fuelId');
      expect(vehicle).not.toHaveProperty('brandId');
      expect(vehicle).not.toHaveProperty('versionId');
    });

    /** The tenant's own answer beats a table lookup that could disagree. */
    it("keeps the record's own brand name over the looked-up one", async () => {
      const resource = makeResource({
        getByPlate: vi.fn().mockResolvedValue({
          plate: '00-00-ZZ',
          brand_id: 42,
          brand_name: 'Renault Trucks',
        }),
      });

      const vehicle = await makeService(resource).getByPlate('0000ZZ', context);

      expect(vehicle.brand).toBe('Renault Trucks');
    });

    it('publishes the detail fields the page had been missing', async () => {
      const resource = makeResource({
        getByPlate: vi.fn().mockResolvedValue({
          plate: '00-00-ZZ',
          vin: 'VF1234567890',
          color: 'Cinzento',
          km_counter: 128_400,
          monthly_kms: 1_500,
          next_inspection_date: '2027-03-01',
          owner_name: 'Ana Silva',
          owner_customer_id: 7,
          is_active: true,
        }),
      });

      const vehicle = await makeService(resource).getByPlate('0000ZZ', context);

      expect(vehicle).toMatchObject({
        vin: 'VF1234567890',
        color: 'Cinzento',
        mileage: 128_400,
        monthlyMileage: 1_500,
        ownerName: 'Ana Silva',
        customerId: '7',
        active: true,
      });
      expect(vehicle.nextInspectionAt).toMatch(/^2027-03-01/);
    });

    /**
     * A vehicle page that renders without the fuel name is useful; one that
     * fails because a decoration could not be fetched is not. The reference
     * tables sit behind their own upstream permission.
     */
    it('still answers when the reference tables cannot be read', async () => {
      const catalogue = makeCatalogue({
        listFuels: vi.fn().mockRejectedValue(new Error('403')),
        listBrands: vi.fn().mockRejectedValue(new Error('403')),
        getVersion: vi.fn().mockRejectedValue(new Error('403')),
      });

      const resource = makeResource({
        getByPlate: vi.fn().mockResolvedValue({ plate: '00-00-ZZ', fuel_id: 17, version_id: 900 }),
      });

      const vehicle = await makeService(resource, catalogue).getByPlate('0000ZZ', context);

      expect(vehicle.plate).toBe('0000ZZ');
      expect(vehicle.fuel).toBeUndefined();
      expect(vehicle.version).toBeUndefined();
    });
  });

  describe('list', () => {
    it('asks for the newest records first', async () => {
      const resource = makeResource();

      await makeService(resource).list({ page: 1, perPage: 10 }, context);

      expect(resource.list).toHaveBeenCalledWith(
        expect.objectContaining({ newestFirst: true }),
        expect.anything(),
      );
    });

    it.each([
      ['active', true],
      ['inactive', false],
    ] as const)('sends %s as is_active=%s', async (status, isActive) => {
      const resource = makeResource();

      await makeService(resource).list({ page: 1, perPage: 10, status }, context);

      expect(resource.list).toHaveBeenCalledWith(
        expect.objectContaining({ isActive }),
        expect.anything(),
      );
    });

    it('leaves the state unfiltered when no status is asked for', async () => {
      const resource = makeResource();

      await makeService(resource).list({ page: 1, perPage: 10 }, context);

      expect(resource.list).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: undefined }),
        expect.anything(),
      );
    });

    /**
     * The fields below are on list rows too — they were simply never read,
     * which is why the columns rendered as dashes.
     */
    it('resolves names on list rows, not only on the detail record', async () => {
      const resource = makeResource({
        list: vi.fn().mockResolvedValue({
          items: [{ plate: '00-00-ZZ', fuel_id: 17, brand_id: 42, km_counter: 90_000 }],
          meta: {},
        }),
      });

      const result = await makeService(resource).list({ page: 1, perPage: 10 }, context);

      expect(result.vehicles[0]).toMatchObject({
        plate: '0000ZZ',
        fuel: 'Diesel',
        brand: 'Renault',
        mileage: 90_000,
      });
    });

    it('drops a record with no plate rather than publishing an unusable row', async () => {
      const resource = makeResource({
        list: vi.fn().mockResolvedValue({ items: [{ description: 'no plate here' }], meta: {} }),
      });

      const result = await makeService(resource).list({ page: 1, perPage: 10 }, context);

      expect(result.vehicles).toHaveLength(0);
    });

    /**
     * The dashboard asks for this on every visit and the sweep is 11 upstream
     * requests, so the unfiltered total is cached. A filtered one is a question
     * one person asked about one term, and is swept fresh.
     */
    it('sweeps the collection once and caches the unfiltered total', async () => {
      const resource = makeResource({
        list: vi
          .fn()
          .mockResolvedValue({ items: [{ plate: '00-00-ZZ' }], meta: { has_more: false } }),
      });
      const service = makeService(resource);

      const first = await service.count({ page: 1, perPage: 25 }, context);
      const second = await service.count({ page: 1, perPage: 25 }, context);

      expect(first.total).toBe(1);
      expect(second.total).toBe(1);
      expect(resource.list).toHaveBeenCalledTimes(1);
    });

    it('does not serve a cached total for a filtered count', async () => {
      const resource = makeResource({
        list: vi
          .fn()
          .mockResolvedValue({ items: [{ plate: '00-00-ZZ' }], meta: { has_more: false } }),
      });
      const service = makeService(resource);

      await service.count({ page: 1, perPage: 25 }, context);
      await service.count({ page: 1, perPage: 25, status: 'inactive' }, context);
      await service.count({ page: 1, perPage: 25, search: '00-00-ZZ' }, context);

      expect(resource.list).toHaveBeenCalledTimes(3);
    });

    /** Ordering is the upstream's job; the count sweep only needs totals. */
    it('does not ask the count sweep to sort', async () => {
      const resource = makeResource({
        list: vi.fn().mockResolvedValue({ items: [], meta: { has_more: false } }),
      });

      await makeService(resource).count({ page: 1, perPage: 25, status: 'active' }, context);

      expect(resource.list).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
        expect.anything(),
      );
      expect(resource.list).not.toHaveBeenCalledWith(
        expect.objectContaining({ newestFirst: true }),
        expect.anything(),
      );
    });
  });
});
