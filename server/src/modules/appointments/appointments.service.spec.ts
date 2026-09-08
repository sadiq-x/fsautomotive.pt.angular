/**
 * The listing window, at a fixed instant.
 *
 * The clock is injected precisely so these assertions do not depend on when the
 * suite runs — the usual way a "defaults to the last thirty days" rule becomes
 * flaky.
 */
import { describe, expect, it, vi } from 'vitest';

import type { AppointmentsResource } from '../../integrations/officegest/index.js';
import type { Logger } from '../../shared/logger.js';
import { AppointmentsService } from './appointments.service.js';

const NOW = new Date('2026-08-28T09:00:00.000Z');

const silentLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
} as unknown as Logger;

const context = { logger: silentLogger };

function makeResource(overrides: Partial<AppointmentsResource> = {}): AppointmentsResource {
  return {
    list: vi.fn().mockResolvedValue({ items: [], meta: undefined }),
    getById: vi.fn(),
    ...overrides,
  } as unknown as AppointmentsResource;
}

function makeService(resource = makeResource()): AppointmentsService {
  return new AppointmentsService(resource, () => NOW);
}

/** An upstream record, in the shape the tenant actually returns. */
function record(
  id: string,
  start: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return { id, title: `Marcação ${id}`, start, end: start, ...extra };
}

/** A resource whose window is exactly these records, on one page. */
function windowOf(...records: readonly Record<string, unknown>[]): AppointmentsResource {
  return makeResource({
    list: vi.fn().mockResolvedValue({ items: records, meta: { has_more: false } }),
  });
}

describe('AppointmentsService', () => {
  describe('list', () => {
    /**
     * 5.3 on screen: the newest booking is the one someone opened the page to
     * see. Upstream returns no dependable order, so this is the service's job.
     */
    it('returns the most recent booking first, whatever order upstream used', async () => {
      const service = makeService(
        windowOf(
          record('1', '2026-08-01 09:00:00'),
          record('3', '2026-08-30 09:00:00'),
          record('2', '2026-08-15 09:00:00'),
        ),
      );

      const result = await service.list({ page: 1, perPage: 10 }, context);

      expect(result.appointments.map((a) => a.id)).toEqual(['3', '2', '1']);
    });

    it('sorts a booking with no date last rather than first', async () => {
      const service = makeService(
        windowOf({ id: 'undated', title: 'Sem data' }, record('dated', '2026-08-01 09:00:00')),
      );

      const result = await service.list({ page: 1, perPage: 10 }, context);

      expect(result.appointments.map((a) => a.id)).toEqual(['dated', 'undated']);
    });

    it('reports an exact total, which upstream never provides', async () => {
      const service = makeService(
        windowOf(
          record('1', '2026-08-01 09:00:00'),
          record('2', '2026-08-02 09:00:00'),
          record('3', '2026-08-03 09:00:00'),
        ),
      );

      const result = await service.list({ page: 2, perPage: 2 }, context);

      expect(result.meta).toMatchObject({ page: 2, perPage: 2, total: 3, totalPages: 2 });
      expect(result.appointments).toHaveLength(1);
      expect(result.meta.hasMore).toBe(false);
    });

    /**
     * The property that makes filtering on this side legitimate: the page is
     * cut *after* the filter, so page 1 of a filtered list is full.
     */
    it('paginates the filtered set, not the fetched one', async () => {
      const service = makeService(
        windowOf(
          record('1', '2026-08-01 09:00:00', { completed: true }),
          record('2', '2026-08-02 09:00:00'),
          record('3', '2026-08-03 09:00:00', { completed: true }),
          record('4', '2026-08-04 09:00:00'),
        ),
      );

      const result = await service.list({ page: 1, perPage: 10, status: 'completed' }, context);

      expect(result.appointments.map((a) => a.id)).toEqual(['3', '1']);
      expect(result.meta.total).toBe(2);
    });

    it('selects the bookings with no state at all', async () => {
      const service = makeService(
        windowOf(
          record('1', '2026-08-01 09:00:00', { completed: true }),
          record('2', '2026-08-02 09:00:00'),
        ),
      );

      const result = await service.list({ page: 1, perPage: 10, status: 'none' }, context);

      expect(result.appointments.map((a) => a.id)).toEqual(['2']);
    });

    it('searches without regard to case or accents', async () => {
      const service = makeService(
        windowOf(
          { id: '1', title: 'Revisão dos travões', start: '2026-08-01 09:00:00' },
          { id: '2', title: 'Alinhamento', start: '2026-08-02 09:00:00' },
        ),
      );

      const result = await service.list({ page: 1, perPage: 10, search: '  REVISAO ' }, context);

      expect(result.appointments.map((a) => a.id)).toEqual(['1']);
    });

    it('searches the location as well as the title', async () => {
      const service = makeService(
        windowOf(
          record('1', '2026-08-01 09:00:00', { location: '[1] Sede' }),
          record('2', '2026-08-02 09:00:00', { location: 'DRIVE 360 EM FRIELAS' }),
        ),
      );

      const result = await service.list({ page: 1, perPage: 10, search: 'frielas' }, context);

      expect(result.appointments.map((a) => a.id)).toEqual(['2']);
    });

    it('combines the state and the search with AND', async () => {
      const service = makeService(
        windowOf(
          { id: '1', title: 'Revisão', start: '2026-08-01 09:00:00', completed: true },
          { id: '2', title: 'Revisão', start: '2026-08-02 09:00:00' },
          { id: '3', title: 'Pintura', start: '2026-08-03 09:00:00', completed: true },
        ),
      );

      const result = await service.list(
        { page: 1, perPage: 10, status: 'completed', search: 'revisao' },
        context,
      );

      expect(result.appointments.map((a) => a.id)).toEqual(['1']);
    });

    /**
     * Sorting and filtering are only honest over the whole window, so the
     * service follows upstream's paging rather than reading one page.
     */
    it('follows upstream paging until the window is complete', async () => {
      const list = vi
        .fn()
        .mockResolvedValueOnce({
          items: [record('a', '2026-08-01 09:00:00')],
          meta: { has_more: true },
        })
        .mockResolvedValueOnce({
          items: [record('b', '2026-08-02 09:00:00')],
          meta: { has_more: false },
        });

      const result = await makeService(makeResource({ list })).list(
        { page: 1, perPage: 10 },
        context,
      );

      expect(list).toHaveBeenCalledTimes(2);
      expect(result.appointments.map((a) => a.id)).toEqual(['b', 'a']);
      expect(list.mock.calls[1]?.[0]).toMatchObject({ page: 2 });
    });

    it('stops at the page cap instead of following upstream for ever', async () => {
      const list = vi.fn().mockResolvedValue({
        items: [record('x', '2026-08-01 09:00:00')],
        meta: { has_more: true },
      });
      const warn = vi.fn();
      const logger = { ...silentLogger, warn } as unknown as Logger;

      await makeService(makeResource({ list })).list({ page: 1, perPage: 10 }, { logger });

      expect(list).toHaveBeenCalledTimes(10);
      expect(warn).toHaveBeenCalled();
    });

    it('maps the fields the tenant actually sends', async () => {
      const service = makeService(
        windowOf({
          id: '503',
          title: 'FERIAS DE 3/08 A 17/08',
          start: '2026-08-03 08:30:00',
          end: '2026-08-17 09:00:00',
          employee_id: 8,
          priority: 'N',
          location: '[1] Sede',
          completed: true,
        }),
      );

      const [appointment] = (await service.list({ page: 1, perPage: 10 }, context)).appointments;

      expect(appointment).toMatchObject({
        id: '503',
        title: 'FERIAS DE 3/08 A 17/08',
        status: 'completed',
        // A number upstream, an opaque label here.
        employeeId: '8',
        priority: 'N',
        location: '[1] Sede',
      });
    });

    it('rejects a reversed date range without calling the upstream', async () => {
      const resource = makeResource();

      await expect(
        makeService(resource).list(
          {
            page: 1,
            perPage: 25,
            from: '2026-09-01T00:00:00.000Z',
            to: '2026-08-01T00:00:00.000Z',
          },
          context,
        ),
      ).rejects.toMatchObject({ httpStatus: 400 });
      expect(resource.list).not.toHaveBeenCalled();
    });

    it('translates our filters into the upstream parameter names', async () => {
      const list = vi.fn().mockResolvedValue({ items: [], meta: undefined });

      await makeService(makeResource({ list })).list(
        {
          page: 1,
          perPage: 25,
          from: '2026-08-01T00:00:00.000Z',
          to: '2026-08-31T00:00:00.000Z',
          customerId: '42',
        },
        context,
      );

      expect(list.mock.calls[0]?.[0]).toMatchObject({
        filters: {
          start: '2026-08-01T00:00:00.000Z',
          end: '2026-08-31T00:00:00.000Z',
          customer_id: '42',
        },
      });
    });

    /**
     * `start` and `end` are required by OfficeGest — a list request without
     * them is answered 422, not with an unfiltered list. So the service has to
     * supply a window when the caller does not, and the Marcações page does not:
     * it sends only `page` and `perPage`.
     */
    it('supplies a range when the caller gives none, because upstream demands one', async () => {
      const list = vi.fn().mockResolvedValue({ items: [], meta: undefined });

      await makeService(makeResource({ list })).list({ page: 1, perPage: 25 }, context);

      const filters = list.mock.calls[0]?.[0]?.filters as Record<string, string>;

      expect(filters['start']).toBe('2026-07-29T09:00:00.000Z'); // NOW − 30 days
      expect(filters['end']).toBe('2026-11-26T09:00:00.000Z'); // NOW + 90 days
    });

    it('lets the caller override either end of the default window', async () => {
      const list = vi.fn().mockResolvedValue({ items: [], meta: undefined });

      await makeService(makeResource({ list })).list(
        { page: 1, perPage: 25, from: '2026-08-01T00:00:00.000Z' },
        context,
      );

      const filters = list.mock.calls[0]?.[0]?.filters as Record<string, string>;

      expect(filters['start']).toBe('2026-08-01T00:00:00.000Z');
      expect(filters['end']).toBe('2026-11-26T09:00:00.000Z');
    });
  });
});
