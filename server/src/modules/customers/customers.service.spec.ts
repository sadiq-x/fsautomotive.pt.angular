/**
 * Customer use cases, against a stubbed resource.
 *
 * The resource is stubbed rather than the client, because the service's contract
 * is with the resource: what it does with the records it is handed, and what it
 * does when they are not what it expected.
 */
import { describe, expect, it, vi } from 'vitest';

import type { CustomersResource } from '../../integrations/officegest/index.js';
import { OfficeGestNotFoundError } from '../../integrations/officegest/officegest.errors.js';
import type { Logger } from '../../shared/logger.js';
import { CustomersService } from './customers.service.js';

const silentLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
} satisfies Record<string, unknown> as unknown as Logger;

const context = { logger: silentLogger };

function makeResource(overrides: Partial<CustomersResource> = {}): CustomersResource {
  return {
    list: vi.fn(),
    getById: vi.fn(),
    ...overrides,
  } as unknown as CustomersResource;
}

describe('CustomersService', () => {
  describe('list', () => {
    it('maps upstream records onto the published model', async () => {
      const resource = makeResource({
        list: vi.fn().mockResolvedValue({
          items: [
            {
              id: 42,
              nome: 'Ana Silva',
              nif: '123456789',
              email: 'ana@example.pt',
              telemovel: '910000000',
              activo: '1',
              // Commercial data that must not be published.
              saldo: 1234.5,
            },
          ],
          meta: { current_page: 1, total: 1 },
        }),
      });

      const result = await new CustomersService(resource).list({ page: 1, perPage: 25 }, context);

      expect(result.customers).toEqual([
        {
          id: '42',
          name: 'Ana Silva',
          taxId: '123456789',
          email: 'ana@example.pt',
          phone: undefined,
          mobile: '910000000',
          city: undefined,
          postalCode: undefined,
          country: undefined,
          active: true,
        },
      ]);
      // The balance was in the upstream record and is not in the output.
      expect(JSON.stringify(result.customers)).not.toContain('1234.5');
    });

    it('reports our pagination alongside the upstream total', async () => {
      const resource = makeResource({
        list: vi.fn().mockResolvedValue({ items: [], meta: { total: 130 } }),
      });

      const result = await new CustomersService(resource).list({ page: 3, perPage: 25 }, context);

      expect(result.meta).toEqual({ page: 3, perPage: 25, total: 130, totalPages: 6 });
    });

    it('omits totals when the upstream did not report one', async () => {
      const resource = makeResource({
        list: vi.fn().mockResolvedValue({ items: [], meta: undefined }),
      });

      const result = await new CustomersService(resource).list({ page: 1, perPage: 25 }, context);

      expect(result.meta).toEqual({ page: 1, perPage: 25 });
    });

    it('drops records with no identifier instead of publishing unusable entries', async () => {
      const resource = makeResource({
        list: vi.fn().mockResolvedValue({
          items: [{ id: '1', nome: 'Keep' }, { nome: 'No id' }],
          meta: undefined,
        }),
      });

      const result = await new CustomersService(resource).list({ page: 1, perPage: 25 }, context);

      expect(result.customers).toHaveLength(1);
      expect(silentLogger.warn).toHaveBeenCalled();
    });

    it('forwards the search term and the cancellation signal to the resource', async () => {
      const list = vi.fn().mockResolvedValue({ items: [], meta: undefined });
      const controller = new AbortController();

      await new CustomersService(makeResource({ list })).list(
        { page: 2, perPage: 10, search: 'silva' },
        { logger: silentLogger, signal: controller.signal },
      );

      expect(list).toHaveBeenCalledWith(
        { page: 2, perPage: 10, search: 'silva' },
        { logger: silentLogger, signal: controller.signal },
      );
    });

    it('lets an upstream failure through untranslated, for the error layer to map', async () => {
      const resource = makeResource({
        list: vi
          .fn()
          .mockRejectedValue(
            new OfficeGestNotFoundError({ path: '/entities/customers', method: 'GET' }),
          ),
      });

      await expect(
        new CustomersService(resource).list({ page: 1, perPage: 25 }, context),
      ).rejects.toBeInstanceOf(OfficeGestNotFoundError);
    });
  });

  describe('getById', () => {
    it('returns the mapped customer', async () => {
      const resource = makeResource({
        getById: vi.fn().mockResolvedValue({ id: '7', name: 'Bruno' }),
      });

      await expect(new CustomersService(resource).getById('7', context)).resolves.toMatchObject({
        id: '7',
        name: 'Bruno',
      });
    });

    it('fails loudly when a 200 carries no usable identifier', async () => {
      const resource = makeResource({ getById: vi.fn().mockResolvedValue({ name: 'No id' }) });

      await expect(new CustomersService(resource).getById('7', context)).rejects.toMatchObject({
        httpStatus: 502,
        code: 'OFFICEGEST_MALFORMED_RESPONSE',
      });
    });
  });
});
