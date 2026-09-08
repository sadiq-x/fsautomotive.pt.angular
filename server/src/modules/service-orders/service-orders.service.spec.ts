/**
 * Listing work orders.
 *
 * The properties here all exist because `/workshop/service-orders` cannot do
 * them itself: it ignores `page`, pages by cursor, has no search parameter, and
 * matches plates only in their hyphenated form. Each test pins one of those.
 */
import { describe, expect, it, vi } from 'vitest';

import type { ServiceOrdersResource } from '../../integrations/officegest/index.js';
import type { Logger } from '../../shared/logger.js';
import { ServiceOrdersService } from './service-orders.service.js';

const silentLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
} as unknown as Logger;

const context = { logger: silentLogger };

/** An upstream record in the shape the tenant returns. */
function record(number: number, date: string, extra: Record<string, unknown> = {}) {
  return { number, document_number: `OSV BF2024/${number}`, date, ...extra };
}

/** A resource that returns one batch and reports no further cursor. */
function oneBatch(...items: Record<string, unknown>[]): ServiceOrdersResource {
  return {
    list: vi.fn().mockResolvedValue({ items, meta: { next: null } }),
    getById: vi.fn(),
  } as unknown as ServiceOrdersResource;
}

function service(resource: ServiceOrdersResource): ServiceOrdersService {
  return new ServiceOrdersService(resource);
}

const BASE = { page: 1, perPage: 10 } as const;

describe('ServiceOrdersService.list', () => {
  it('returns the most recent job first', async () => {
    const result = await service(
      oneBatch(record(1, '2025-02-26'), record(3, '2025-04-01'), record(2, '2025-03-15')),
    ).list(BASE, context);

    expect(result.serviceOrders.map((order) => order.id)).toEqual(['3', '2', '1']);
  });

  it('sorts a job with no date last', async () => {
    const result = await service(oneBatch({ number: 9 }, record(1, '2025-02-26'))).list(
      BASE,
      context,
    );

    expect(result.serviceOrders.map((order) => order.id)).toEqual(['1', '9']);
  });

  /**
   * Upstream ignores `page` — every page number returns the same records — so
   * paging is this service's responsibility or it does not happen at all.
   */
  it('paginates the window itself, since upstream ignores page numbers', async () => {
    const resource = oneBatch(
      record(1, '2025-01-01'),
      record(2, '2025-01-02'),
      record(3, '2025-01-03'),
    );

    const first = await service(resource).list({ page: 1, perPage: 2 }, context);
    const second = await service(resource).list({ page: 2, perPage: 2 }, context);

    expect(first.serviceOrders.map((o) => o.id)).toEqual(['3', '2']);
    expect(second.serviceOrders.map((o) => o.id)).toEqual(['1']);
    expect(first.meta).toMatchObject({ total: 3, totalPages: 2, hasMore: true });
    expect(second.meta.hasMore).toBe(false);
  });

  it('follows the cursor until the window is complete', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({ items: [record(1, '2025-01-01')], meta: { next: 'CURSOR-2' } })
      .mockResolvedValueOnce({ items: [record(2, '2025-01-02')], meta: { next: null } });

    const result = await service({
      list,
      getById: vi.fn(),
    } as unknown as ServiceOrdersResource).list(BASE, context);

    expect(list).toHaveBeenCalledTimes(2);
    expect(list.mock.calls[0]?.[0]).toMatchObject({ cursor: undefined });
    expect(list.mock.calls[1]?.[0]).toMatchObject({ cursor: 'CURSOR-2' });
    expect(result.serviceOrders).toHaveLength(2);
  });

  it('stops at the request cap instead of following the cursor for ever', async () => {
    const list = vi
      .fn()
      .mockResolvedValue({ items: [record(1, '2025-01-01')], meta: { next: 'C' } });
    const warn = vi.fn();

    await service({ list, getById: vi.fn() } as unknown as ServiceOrdersResource).list(BASE, {
      logger: { ...silentLogger, warn } as unknown as Logger,
    });

    expect(list).toHaveBeenCalledTimes(15);
    expect(warn).toHaveBeenCalled();
  });

  /**
   * The bug this replaced: the plate was forwarded normalised (`61SQ64`), and
   * the endpoint returns nothing at all for that form. Every vehicle filter
   * answered "no results".
   */
  it('sends the plate hyphenated, which is the only form upstream matches', async () => {
    const resource = oneBatch();

    await service(resource).list({ ...BASE, plate: '61SQ64' }, context);

    expect(vi.mocked(resource.list).mock.calls[0]?.[0]).toMatchObject({
      filters: expect.objectContaining({ plate: '61-SQ-64' }),
    });
  });

  it('sends the date window as the plain dates upstream expects', async () => {
    const resource = oneBatch();

    await service(resource).list(
      { ...BASE, from: '2026-09-01T00:00:00.000Z', to: '2026-09-30T23:59:59.999Z' },
      context,
    );

    expect(vi.mocked(resource.list).mock.calls[0]?.[0]).toMatchObject({
      filters: expect.objectContaining({ date_from: '2026-09-01', date_to: '2026-09-30' }),
    });
  });

  it('rejects a reversed date range without calling the upstream', async () => {
    const resource = oneBatch();

    await expect(
      service(resource).list(
        { ...BASE, from: '2026-09-30T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
        context,
      ),
    ).rejects.toMatchObject({ httpStatus: 400 });
    expect(resource.list).not.toHaveBeenCalled();
  });

  describe('search, which upstream cannot do', () => {
    const resource = () =>
      oneBatch(
        record(1, '2025-01-01', { invoice_name: 'Ana Silva', plate: '61-SQ-64' }),
        record(2, '2025-01-02', { observations: 'Travões dianteiros' }),
        record(3, '2025-01-03', { invoice_name: 'Bruno Costa' }),
      );

    it.each([
      ['a customer name', 'ana', ['1']],
      ['ignoring accents and case', 'TRAVOES', ['2']],
      ['a plate as stored', '61SQ64', ['1']],
      // What the table actually shows, which is what a person will type.
      ['the hyphenated plate as displayed', '61-SQ-64', ['1']],
      ['the document number', 'BF2024/3', ['3']],
    ])('matches %s', async (_label, term, expected) => {
      const result = await service(resource()).list({ ...BASE, search: term }, context);

      expect(result.serviceOrders.map((o) => o.id)).toEqual(expected);
    });

    it('reports the total of the matched set, not of the window', async () => {
      const result = await service(resource()).list({ ...BASE, search: 'ana' }, context);

      expect(result.meta.total).toBe(1);
    });
  });
});
