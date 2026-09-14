/**
 * Reading the board by mechanic instead of by car.
 *
 * The cases below are the ones that decide whether a foreman can trust the
 * panel: a mechanic who is on nothing must still appear, a mechanic on two cars
 * must show both, and a mechanic who is demonstrably working must never be
 * dropped because a roster has fallen behind.
 */
import type { MonitorBoard, MonitorServiceOrder } from '../../models';
import { toMechanicsOnDuty } from './mechanic-on-duty';

const OBSERVED_AT = '2026-09-13T10:00:00.000Z';

function order(
  id: string,
  mechanics: MonitorServiceOrder['mechanics'],
  overrides: Partial<MonitorServiceOrder> = {},
): MonitorServiceOrder {
  return {
    id,
    plate: '61SQ64',
    vehicle: { brand: 'Renault', model: 'Clio' },
    interventions: [],
    mechanics,
    ...overrides,
  };
}

function board(
  serviceOrders: readonly MonitorServiceOrder[],
  roster: MonitorBoard['roster'] = [],
): MonitorBoard {
  return {
    serviceOrders,
    roster,
    observedAt: OBSERVED_AT,
    activeMechanicCount: serviceOrders.filter((o) => o.mechanics.length > 0).length,
  };
}

describe('toMechanicsOnDuty', () => {
  /**
   * This tenant's actual situation: five mechanics registered, nobody clocked
   * on. Built from assignments alone the panel would be empty, which reads as a
   * broken screen rather than an idle workshop.
   */
  it('lists a mechanic who is on no car at all', () => {
    const result = toMechanicsOnDuty(
      board(
        [],
        [
          { employeeCode: '7', name: 'João' },
          { employeeCode: '8', name: 'Rui' },
        ],
      ),
    );

    expect(result).toEqual([
      { employeeCode: '7', name: 'João', cars: [] },
      { employeeCode: '8', name: 'Rui', cars: [] },
    ]);
  });

  it('names the car a mechanic is working on', () => {
    const result = toMechanicsOnDuty(
      board(
        [order('4821', [{ employeeCode: '7', name: 'João', startedAt: OBSERVED_AT }])],
        [{ employeeCode: '7', name: 'João' }],
      ),
    );

    expect(result[0]?.cars).toEqual([
      {
        serviceOrderId: '4821',
        plate: '61SQ64',
        vehicle: 'Renault Clio',
        startedAt: OBSERVED_AT,
      },
    ]);
  });

  /**
   * Upstream does not forbid it, and a shape that assumed one car would
   * silently drop the second — showing a mechanic at a car they had left.
   */
  it('shows both cars when a mechanic is on two jobs', () => {
    const result = toMechanicsOnDuty(
      board(
        [
          order('1', [{ employeeCode: '7', startedAt: OBSERVED_AT }]),
          order('2', [{ employeeCode: '7', startedAt: OBSERVED_AT }], { plate: '00AA00' }),
        ],
        [{ employeeCode: '7', name: 'João' }],
      ),
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.cars.map((car) => car.serviceOrderId)).toEqual(['1', '2']);
  });

  /** A stale roster must not erase somebody who is demonstrably working. */
  it('keeps a mechanic who is at a car but missing from the roster', () => {
    const result = toMechanicsOnDuty(
      board([order('1', [{ employeeCode: '99', name: 'Novo' }])], [{ employeeCode: '7' }]),
    );

    expect(result.map((mechanic) => mechanic.employeeCode)).toContain('99');
  });

  it('falls back to the employee code when nobody sent a name', () => {
    const result = toMechanicsOnDuty(board([], [{ employeeCode: '7' }]));

    expect(result[0]?.name).toBe('7');
  });

  /** The roster may carry no name; the assignment upstream attached to the work does. */
  it('prefers the name on the assignment over the roster', () => {
    const result = toMechanicsOnDuty(
      board([order('1', [{ employeeCode: '7', name: 'João Silva' }])], [{ employeeCode: '7' }]),
    );

    expect(result[0]?.name).toBe('João Silva');
  });

  describe('the order they are listed in', () => {
    it('puts the people at a car above the people who are free', () => {
      const result = toMechanicsOnDuty(
        board(
          [order('1', [{ employeeCode: '8', startedAt: OBSERVED_AT }])],
          [
            { employeeCode: '7', name: 'Ana' },
            { employeeCode: '8', name: 'Zé' },
          ],
        ),
      );

      expect(result.map((mechanic) => mechanic.name)).toEqual(['Zé', 'Ana']);
    });

    it('puts the longest-running job first', () => {
      const result = toMechanicsOnDuty(
        board(
          [
            order('1', [{ employeeCode: '7', name: 'Recente', startedAt: '2026-09-13T09:50:00Z' }]),
            order('2', [{ employeeCode: '8', name: 'Antigo', startedAt: '2026-09-13T08:00:00Z' }]),
          ],
          [],
        ),
      );

      expect(result.map((mechanic) => mechanic.name)).toEqual(['Antigo', 'Recente']);
    });

    /** Otherwise the free half of the list would reshuffle between polls. */
    it('orders the free mechanics by name so the list does not wobble', () => {
      const result = toMechanicsOnDuty(
        board(
          [],
          [
            { employeeCode: '9', name: 'Rui' },
            { employeeCode: '7', name: 'Ana' },
            { employeeCode: '8', name: 'Nuno' },
          ],
        ),
      );

      expect(result.map((mechanic) => mechanic.name)).toEqual(['Ana', 'Nuno', 'Rui']);
    });
  });
});
