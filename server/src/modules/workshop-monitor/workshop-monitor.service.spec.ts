/**
 * Serving the live board.
 *
 * The properties pinned here are the ones that stop this feature from being a
 * denial-of-service against the tenant's own API quota, and the ones that decide
 * what a mechanic sees first when they look up at the screen.
 */
import { describe, expect, it, vi } from 'vitest';

import type { WorkshopMonitorResource } from '../../integrations/officegest/index.js';
import type { Logger } from '../../shared/logger.js';
import { WorkshopMonitorService } from './workshop-monitor.service.js';

function makeLogger() {
  const log = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  } as unknown as Logger;
  (log.child as ReturnType<typeof vi.fn>).mockReturnValue(log);
  return log;
}

const logger = makeLogger();
const context = { logger };

/** The roster every board fetch also reads. Five names on the real tenant. */
const ROSTER = [
  { id: 7, name: 'João', department_id: 1 },
  { id: 8, name: 'Rui' },
];

/** A mechanic's `department_id` is a bare number without this table. */
const DEPARTMENTS = [{ id: 1, name: 'Mecânica' }];

/**
 * The price list. Joined to a job by *name*, not by id — the ids on a work
 * order's interventions are document references and match nothing here.
 */
const CATALOGUE = [
  { id: 42, description: 'Mudança de óleo', estimated_time: 30 },
  { id: 43, description: 'Travões', estimated_time: 0 },
];

/** A resource returning one board page, one roster, and reporting no more. */
function board(items: Record<string, unknown>[], meta: Record<string, unknown> = {}) {
  const listActive = vi.fn().mockResolvedValue({ items, meta: { has_more: false, ...meta } });
  const listMechanics = vi.fn().mockResolvedValue({ items: ROSTER, meta: {} });
  const listDepartments = vi.fn().mockResolvedValue({ items: DEPARTMENTS, meta: {} });
  const listInterventionCatalogue = vi.fn().mockResolvedValue({ items: CATALOGUE, meta: {} });

  return {
    resource: {
      listActive,
      listMechanics,
      listDepartments,
      listInterventionCatalogue,
    } as unknown as WorkshopMonitorResource,
    listActive,
    listMechanics,
    listDepartments,
    listInterventionCatalogue,
  };
}

function service(resource: WorkshopMonitorResource, log: Logger = logger) {
  return new WorkshopMonitorService(resource, log);
}

describe('WorkshopMonitorService.board', () => {
  /**
   * The wall screens all ask for the same unfiltered board. If each poll became
   * an upstream request, the load on OfficeGest would scale with the number of
   * browsers open in the workshop.
   */
  it('serves every caller of the unfiltered board from one upstream request', async () => {
    const { resource, listActive } = board([{ number: 1 }]);
    const monitor = service(resource);

    await Promise.all([monitor.board({}, context), monitor.board({}, context)]);
    await monitor.board({}, context);

    expect(listActive).toHaveBeenCalledTimes(1);
  });

  /** One caller's plate filter must never be served to somebody else. */
  it('does not cache a filtered board', async () => {
    const { resource, listActive } = board([{ number: 1 }]);
    const monitor = service(resource);

    await monitor.board({ plate: '61SQ64' }, context);
    await monitor.board({ plate: '61SQ64' }, context);

    expect(listActive).toHaveBeenCalledTimes(2);
  });

  /** Upstream matches `61-SQ-64` and returns nothing at all for `61SQ64`. */
  it('sends the plate hyphenated, which is the only form upstream matches', async () => {
    const { resource, listActive } = board([]);

    await service(resource).board({ plate: '61SQ64' }, context);

    expect(listActive.mock.calls[0]?.[0]).toMatchObject({ plate: '61-SQ-64' });
  });

  it('forwards the shop calendar so the estimate is in working hours', async () => {
    const { resource, listActive } = board([]);

    await service(resource).board(
      { startHour: '08:30', endHour: '18:00', skipWeekends: true },
      context,
    );

    expect(listActive.mock.calls[0]?.[0]?.schedule).toMatchObject({
      startHour: '08:30',
      endHour: '18:00',
      skipWeekends: true,
    });
  });

  describe('the order cards are read in', () => {
    it('puts jobs with a mechanic on them first', async () => {
      const { resource } = board([
        { number: 1, status: 'ESP' },
        { number: 2, status: 'EXE', mechanics: [{ employee_code: 7 }] },
      ]);

      const result = await service(resource).board({}, context);

      expect(result.serviceOrders.map((order) => order.id)).toEqual(['2', '1']);
    });

    /** Nobody can act on a job waiting for parts today, so it sinks. */
    it('sinks a job that is waiting for parts', async () => {
      const { resource } = board([
        { number: 1, awaiting_parts: true, priority: 9 },
        { number: 2, awaiting_parts: false, priority: 1 },
      ]);

      const result = await service(resource).board({}, context);

      expect(result.serviceOrders.map((order) => order.id)).toEqual(['2', '1']);
    });

    /** Cards must not swap places between two polls of an unchanged board. */
    it('breaks ties on the id so the board does not wobble', async () => {
      const { resource } = board([{ number: 30 }, { number: 12 }, { number: 21 }]);

      const result = await service(resource).board({}, context);

      expect(result.serviceOrders.map((order) => order.id)).toEqual(['12', '21', '30']);
    });
  });

  /**
   * The one number that tells "the workshop is idle" from "nobody is recording
   * their work" — currently always zero on this tenant.
   */
  it('counts the jobs that have somebody clocked on', async () => {
    const { resource } = board([
      { number: 1, mechanics: [{ employee_code: 7 }, { employee_code: 8 }] },
      { number: 2, mechanics: [] },
    ]);

    const result = await service(resource).board({}, context);

    expect(result.activeMechanicCount).toBe(1);
  });

  /**
   * Elapsed time is measured forward from this, not from the browser's clock,
   * so a device whose time is wrong still renders a correct timer.
   */
  it('stamps the snapshot with the server clock', async () => {
    const { resource } = board([]);
    const monitor = new WorkshopMonitorService(
      resource,
      logger,
      () => new Date('2026-09-13T22:00:00.000Z'),
    );

    const result = await monitor.board({ plate: '61SQ64' }, context);

    expect(result.observedAt).toBe('2026-09-13T22:00:00.000Z');
  });

  describe('upstream quota', () => {
    it('warns when the throttle window is nearly spent', async () => {
      const log = makeLogger();
      const { resource } = board([], { throttle_remaining: 4, throttle_limit: 100 });

      await service(resource, log).board({ plate: '61SQ64' }, { logger: log });

      expect(log.warn).toHaveBeenCalledWith(
        'OfficeGest throttle window is nearly spent',
        expect.objectContaining({ remaining: 4, limit: 100 }),
      );
    });

    it('says nothing while there is headroom', async () => {
      const log = makeLogger();
      const { resource } = board([], { throttle_remaining: 90, throttle_limit: 100 });

      await service(resource, log).board({ plate: '61SQ64' }, { logger: log });

      expect(log.warn).not.toHaveBeenCalled();
    });
  });

  describe('estimated time, joined from the price list by name', () => {
    it('puts the standard time on a job that has one', async () => {
      const { resource } = board([
        { number: 1, interventions: [{ intervention: 'Mudança de óleo', completed: false }] },
      ]);

      const result = await service(resource).board({}, context);

      expect(result.serviceOrders[0]?.interventions[0]?.estimatedMinutes).toBe(30);
    });

    /** Case and stray spacing must not silently lose the estimate. */
    it('matches the name regardless of case or surrounding space', async () => {
      const { resource } = board([
        { number: 1, interventions: [{ intervention: '  mudança de óleo ', completed: false }] },
      ]);

      const result = await service(resource).board({}, context);

      expect(result.serviceOrders[0]?.interventions[0]?.estimatedMinutes).toBe(30);
    });

    /** "No estimate recorded" must not render as "estimated: zero minutes". */
    it('leaves a catalogue entry with a zero time without an estimate', async () => {
      const { resource } = board([
        { number: 1, interventions: [{ intervention: 'Travões', completed: false }] },
      ]);

      const result = await service(resource).board({}, context);

      expect(result.serviceOrders[0]?.interventions[0]?.estimatedMinutes).toBeUndefined();
    });

    it('reads the price list once across many board fetches', async () => {
      const { resource, listInterventionCatalogue } = board([{ number: 1 }]);
      const monitor = service(resource);

      await monitor.board({ plate: '61SQ64' }, context);
      await monitor.board({ status: 'EXE' }, context);

      expect(listInterventionCatalogue).toHaveBeenCalledTimes(1);
    });
  });

  describe('the roster, which says who is *not* on a car', () => {
    it('publishes everyone who could be at a car', async () => {
      const { resource } = board([{ number: 1 }]);

      const result = await service(resource).board({}, context);

      expect(result.roster).toEqual([
        { employeeCode: '7', name: 'João', departmentId: '1', department: 'Mecânica' },
        { employeeCode: '8', name: 'Rui', departmentId: undefined },
      ]);
    });

    /** A label beside a name must not cost the column it sits in. */
    it('still lists the mechanics when the department table cannot be read', async () => {
      const log = makeLogger();
      const { resource } = board([{ number: 1 }]);
      (resource as { listDepartments: unknown }).listDepartments = vi
        .fn()
        .mockRejectedValue(new Error('403'));

      const result = await service(resource, log).board({ plate: '61SQ64' }, { logger: log });

      expect(result.roster).toHaveLength(2);
      expect(result.roster[0]?.department).toBeUndefined();
      // The id survives, so "no department" stays distinguishable from
      // "name unavailable".
      expect(result.roster[0]?.departmentId).toBe('1');
    });

    /**
     * Five names that change twice a year, against a board that changes all
     * day. Refetching the roster on every poll would triple the upstream cost
     * of this feature to re-learn the same five names.
     */
    it('reads the roster once across many board fetches', async () => {
      const { resource, listMechanics } = board([{ number: 1 }]);
      const monitor = service(resource);

      await monitor.board({ plate: '61SQ64' }, context);
      await monitor.board({ plate: '00AA00' }, context);
      await monitor.board({ status: 'EXE' }, context);

      expect(listMechanics).toHaveBeenCalledTimes(1);
    });

    /**
     * The roster decorates the board; it is not the board. Losing it must cost
     * the "who is free" column, not the screen.
     */
    it('still renders the board when the roster cannot be read', async () => {
      const log = makeLogger();
      const listActive = vi
        .fn()
        .mockResolvedValue({ items: [{ number: 1 }], meta: { has_more: false } });
      const listMechanics = vi.fn().mockRejectedValue(new Error('403'));
      const listDepartments = vi.fn().mockResolvedValue({ items: [], meta: {} });
      const listInterventionCatalogue = vi.fn().mockResolvedValue({ items: [], meta: {} });

      const result = await service(
        {
          listActive,
          listMechanics,
          listDepartments,
          listInterventionCatalogue,
        } as unknown as WorkshopMonitorResource,
        log,
      ).board({ plate: '61SQ64' }, { logger: log });

      expect(result.serviceOrders).toHaveLength(1);
      expect(result.roster).toEqual([]);
      expect(log.warn).toHaveBeenCalledWith(
        'could not read the mechanic roster; the board will not show who is free',
        expect.objectContaining({ error: '403' }),
      );
    });
  });

  /** An unbounded follow loop on a request path is how one bad page hangs a screen. */
  it('stops following pages at the request cap', async () => {
    const listActive = vi
      .fn()
      .mockResolvedValue({ items: [{ number: 1 }], meta: { has_more: true } });
    const listMechanics = vi.fn().mockResolvedValue({ items: [], meta: {} });
    const listDepartments = vi.fn().mockResolvedValue({ items: [], meta: {} });
    const listInterventionCatalogue = vi.fn().mockResolvedValue({ items: [], meta: {} });
    const log = makeLogger();

    await service(
      {
        listActive,
        listMechanics,
        listDepartments,
        listInterventionCatalogue,
      } as unknown as WorkshopMonitorResource,
      log,
    ).board({ plate: '61SQ64' }, { logger: log });

    expect(listActive).toHaveBeenCalledTimes(2);
    expect(log.warn).toHaveBeenCalledWith(
      'workshop board truncated at the request cap',
      expect.objectContaining({ maxRequests: 2 }),
    );
  });
});

describe('WorkshopMonitorService.orderSnapshot', () => {
  /** A resource whose `getByNumber` answers with one order, or none. */
  function orderResource(items: Record<string, unknown>[]) {
    const getByNumber = vi.fn().mockResolvedValue({ items, meta: {} });
    const listInterventionCatalogue = vi.fn().mockResolvedValue({ items: CATALOGUE, meta: {} });

    return {
      resource: { getByNumber, listInterventionCatalogue } as unknown as WorkshopMonitorResource,
      getByNumber,
    };
  }

  /**
   * The whole reason this method exists: a closed order has left the active
   * board, so its mechanic clock-on can only come from here.
   */
  it('reads a mechanic clock-on off a closed order the active board no longer returns', async () => {
    const { resource } = orderResource([
      {
        number: 202600648,
        status: 'F',
        mechanics: [{ employee_code: 7, start_time: '2026-09-20T09:00:00Z' }],
      },
    ]);

    const snapshot = await service(resource).orderSnapshot('202600648', context);

    expect(snapshot?.mechanics).toEqual([
      expect.objectContaining({ employeeCode: '7', startedAt: '2026-09-20T09:00:00.000Z' }),
    ]);
  });

  it('asks upstream for exactly the one order by number', async () => {
    const { resource, getByNumber } = orderResource([]);

    await service(resource).orderSnapshot('202600648', context);

    expect(getByNumber).toHaveBeenCalledWith('202600648', expect.anything());
  });

  it('resolves to null rather than an order with no id when upstream has nothing', async () => {
    const { resource } = orderResource([]);

    const snapshot = await service(resource).orderSnapshot('999999999', context);

    expect(snapshot).toBeNull();
  });

  /** A garnish, not the meal: the detail page must survive this failing. */
  it('resolves to null and logs a warning when upstream fails', async () => {
    const log = makeLogger();
    const getByNumber = vi.fn().mockRejectedValue(new Error('503'));
    const listInterventionCatalogue = vi.fn().mockResolvedValue({ items: [], meta: {} });

    const snapshot = await service(
      { getByNumber, listInterventionCatalogue } as unknown as WorkshopMonitorResource,
      log,
    ).orderSnapshot('202600648', { logger: log });

    expect(snapshot).toBeNull();
    expect(log.warn).toHaveBeenCalledWith(
      'could not read the monitor record for one order',
      expect.objectContaining({ error: '503' }),
    );
  });
});
