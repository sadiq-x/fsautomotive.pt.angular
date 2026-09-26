/**
 * One mechanic's page.
 *
 * The cases worth pinning are the ones where the page has to distinguish
 * between things that look alike on screen: a mechanic who is idle from a URL
 * that matches nobody, and a staff list that is missing from one that is
 * forbidden. Getting either wrong shows an error where there is no fault.
 */
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, type Observable } from 'rxjs';

import { ApiError, type Paged } from '../../../../../core/models/api.model';
import type {
  Employee,
  MonitorBoard,
  MonitorServiceOrder,
  ServiceOrder,
  ServiceOrderTimeEntry,
} from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { MechanicDetail } from './mechanic-detail';

const OBSERVED_AT = '2026-09-13T10:00:00.000Z';

const JOAO: Employee = {
  id: '7',
  name: 'João',
  email: 'joao@example.test',
  login: 'joao',
  active: true,
};

function order(overrides: Partial<MonitorServiceOrder> = {}): MonitorServiceOrder {
  return {
    id: '4821',
    documentNumber: 'OSV BF2026/12',
    status: 'EXE',
    plate: '61SQ64',
    customerName: 'Maria Silva',
    vehicle: { brand: 'Renault', model: 'Clio', mileage: 184320, fuel: 'Gasóleo' },
    completionPercentage: 0.4,
    interventions: [
      { name: 'Travões', completed: true },
      { name: 'Mudança de óleo', completed: false },
    ],
    mechanics: [{ employeeCode: '7', name: 'João', startedAt: '2026-09-13T08:15:00.000Z' }],
    ...overrides,
  };
}

function board(serviceOrders: readonly MonitorServiceOrder[]): MonitorBoard {
  return {
    serviceOrders,
    roster: [{ employeeCode: '7', name: 'João', departmentId: '1', department: 'MECANICA' }],
    observedAt: OBSERVED_AT,
    activeMechanicCount: serviceOrders.filter((o) => o.mechanics.length > 0).length,
  };
}

interface Options {
  readonly employeeCode?: string;
  readonly boardResponse?: Observable<MonitorBoard>;
  readonly employees?: Observable<ReadonlyMap<string, Employee>>;
  readonly history?: Observable<Paged<ServiceOrder>>;
  /** Keyed by order id; a missing key resolves to no entries. */
  readonly times?: Readonly<Record<string, readonly ServiceOrderTimeEntry[]>>;
}

const NO_HISTORY: Paged<ServiceOrder> = {
  items: [],
  pagination: { page: 1, perPage: 10, total: 0 },
};

function setup(options: Options = {}) {
  const listServiceOrders = vi.fn(() => options.history ?? of(NO_HISTORY));
  const getServiceOrderTimes = vi.fn((id: string) => of(options.times?.[id] ?? []));

  const officegest = {
    getWorkshopBoard: () => options.boardResponse ?? of(board([order()])),
    employeesById: () => options.employees ?? of(new Map([[JOAO.id, JOAO]])),
    listServiceOrders,
    getServiceOrderTimes,
  };

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: OfficeGestService, useValue: officegest },
    ],
  });

  const fixture = TestBed.createComponent(MechanicDetail);
  fixture.componentRef.setInput('employeeCode', options.employeeCode ?? '7');
  fixture.detectChanges();

  return Object.assign(fixture, { listServiceOrders, getServiceOrderTimes });
}

function text(fixture: ReturnType<typeof setup>): string {
  return (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ').trim();
}

describe('MechanicDetail', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(OBSERVED_AT));
  });

  afterEach(() => vi.useRealTimers());

  it('names the car and shows how long it has been worked on', () => {
    const body = text(setup());

    expect(body).toContain('João');
    expect(body).toContain('61-SQ-64');
    expect(body).toContain('Renault Clio');
    // Clocked on at 08:15, snapshot at 10:00.
    expect(body).toContain('1h 45m');
  });

  it('shows the details of the car being repaired', () => {
    const body = text(setup());

    expect(body).toContain('Maria Silva');
    expect(body).toContain('OSV BF2026/12');
    expect(body).toContain('Gasóleo');
    expect(body).toContain('40%');
  });

  it('lists the interventions and how many are done', () => {
    const body = text(setup());

    expect(body).toContain('Travões');
    expect(body).toContain('Mudança de óleo');
    expect(body).toContain('1 de 2');
  });

  it('resolves the department to its name rather than its id', () => {
    expect(text(setup())).toContain('MECANICA');
  });

  it('shows the contact details when the staff list is readable', () => {
    expect(text(setup())).toContain('joao@example.test');
  });

  /**
   * The staff list is guarded by `workers.read`, which this page's own
   * permission does not imply. Being refused it must cost the contact rows and
   * nothing else — the service resolves it to an empty map for that reason.
   */
  it('still renders the work when the staff list is refused', () => {
    const body = text(setup({ employees: of(new Map<string, Employee>()) }));

    expect(body).toContain('61-SQ-64');
    expect(body).not.toContain('joao@example.test');
  });

  /** Idle is not an error, and it is not a bad URL either. */
  it('says the mechanic has no job open rather than showing an error', () => {
    const body = text(setup({ boardResponse: of(board([order({ mechanics: [] })])) }));

    expect(body).toContain('Sem picagem aberta');
    expect(body).not.toContain('Registo não encontrado');
  });

  /** A code matching nobody is a bad address, not a failure of the network. */
  it('reports an unknown mechanic as missing, not as an error', () => {
    const body = text(setup({ employeeCode: '999', boardResponse: of(board([])) }));

    expect(body).toContain('Registo não encontrado');
  });

  describe('the jobs assigned to this mechanic', () => {
    const assigned: Paged<ServiceOrder> = {
      items: [
        {
          id: '25143',
          number: 'OSV BF2026/143',
          plate: '61SQ64',
          status: 'FAC',
          openedAt: '2026-05-02T00:00:00.000Z',
          total: 184.5,
        },
      ],
      pagination: { page: 1, perPage: 10, total: 7 },
    };

    /** Upstream ignores every mechanic filter, so the backend must get the code. */
    it('asks the backend for this mechanic only', () => {
      const fixture = setup({ employeeCode: '7' });

      expect(fixture.listServiceOrders).toHaveBeenCalledWith(
        expect.objectContaining({ mechanicId: '7' }),
      );
    });

    it('lists the cars, with a link to each work order', () => {
      const fixture = setup({ history: of(assigned) });
      const body = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

      expect(body).toContain('OSV BF2026/12');
      expect(body).toContain('61-SQ-64');
      expect(body).toContain('7 folhas atribuídas');

      const link = fixture.nativeElement.querySelector(
        'section[aria-labelledby="historico"] a',
      ) as HTMLAnchorElement;

      expect(link.getAttribute('href')).toBe('/private/service-orders/25143');
    });

    it('explains what the logged-hours column means', () => {
      const fixture = setup({ history: of(assigned) });
      const body = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

      expect(body).toContain('Horas registadas');
      expect(body).toContain('soma as picagens reais deste mecânico');
    });

    describe('logged hours per row', () => {
      /** '7' is this employee code throughout the fixtures above. */
      function timeEntry(overrides: Partial<ServiceOrderTimeEntry> = {}): ServiceOrderTimeEntry {
        return {
          id: '1',
          employeeId: '7',
          employeeName: 'João',
          startedAt: '2026-05-02T08:00:00.000Z',
          endedAt: '2026-05-02T09:30:00.000Z',
          workedMinutes: 90,
          ...overrides,
        };
      }

      it("shows this mechanic's own real worked time on an assigned order", () => {
        const fixture = setup({
          history: of(assigned),
          times: { '25143': [timeEntry()] },
        });
        const body = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

        expect(body).toContain('1 h 30 min');
      });

      it("ignores another mechanic's entries on the same order", () => {
        const fixture = setup({
          history: of(assigned),
          times: { '25143': [timeEntry({ employeeId: '8', employeeName: 'Rui' })] },
        });
        const body = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

        expect(body).not.toContain('1 h 30 min');
      });

      it('sums more than one logged session on the same order', () => {
        const fixture = setup({
          history: of(assigned),
          times: {
            '25143': [
              timeEntry({ id: '1', workedMinutes: 90 }),
              timeEntry({ id: '2', workedMinutes: 30 }),
            ],
          },
        });
        const body = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

        expect(body).toContain('2 h 00 min');
      });

      /** Audit 2026-09-26: an open session has no worked minutes yet. */
      it('shows a dash, not "0 min", when this mechanic’s only session is still open', () => {
        const fixture = setup({
          history: of(assigned),
          times: { '25143': [timeEntry({ endedAt: undefined, workedMinutes: undefined })] },
        });
        const body = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

        expect(body).not.toContain('0 min');
      });

      it('asks /times only for the order actually shown, not the full assigned fetch', () => {
        const fixture = setup({ history: of(assigned) });

        expect(fixture.getServiceOrderTimes).toHaveBeenCalledTimes(1);
        expect(fixture.getServiceOrderTimes).toHaveBeenCalledWith('25143');
      });
    });

    /** Blank usually means the field was never filled in, not that nobody worked. */
    it('explains an empty list rather than implying idleness', () => {
      const fixture = setup({ history: of(NO_HISTORY) });
      const body = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

      expect(body).toContain('O campo é preenchido no OfficeGest');
    });

    it('reports a failed history without taking the page down', () => {
      const fixture = setup({
        history: throwError(() => new ApiError(503, 'UPSTREAM', 'falhou')),
      });
      const body = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

      expect(body).toContain('Não foi possível carregar as folhas de obra');
      // The identification above it is untouched.
      expect(body).toContain('João');
    });
  });

  describe('services to do and done', () => {
    /**
     * The gap this pins. A mechanic was linked to a car *only* by clock-on,
     * and this workshop records assignment instead — 86 assignments against 0
     * clock-ons. So a mechanic with an open car saw an empty page while the
     * board showed that same car with a list of jobs to do.
     */
    it('shows an assigned job that is open on the board, even with no clock-on', () => {
      const fixture = setup({
        boardResponse: of(board([order({ mechanics: [] })])),
        history: of({
          items: [{ id: '4821', number: 'OSV BF2026/12' } as ServiceOrder],
          pagination: { page: 1, perPage: 100, total: 1 },
        }),
      });
      const body = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

      expect(body).toContain('atribuída');
      expect(body).toContain('61-SQ-64');
    });

    it('counts the services done against the total', () => {
      const fixture = setup({
        boardResponse: of(board([order({ mechanics: [] })])),
        history: of({
          items: [{ id: '4821' } as ServiceOrder],
          pagination: { page: 1, perPage: 100, total: 1 },
        }),
      });
      const body = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

      // The fixture row has Travões done and Mudança de óleo outstanding.
      expect(body).toContain('1 de 2 concluídos');
      expect(body).toContain('Mudança de óleo');
      expect(body).toContain('Travões');
    });

    /** A car must never appear twice because it is both clocked on and assigned. */
    it('does not repeat a car that is already shown as a clock-on', () => {
      const fixture = setup({
        history: of({
          items: [{ id: '4821' } as ServiceOrder],
          pagination: { page: 1, perPage: 100, total: 1 },
        }),
      });
      const cards = fixture.nativeElement.querySelectorAll(
        'section[aria-labelledby="trabalho"] article',
      );

      expect(cards.length).toBe(1);
    });

    /** An assignment that is not on the board is history, not current work. */
    it('does not show an assigned job that is no longer open', () => {
      const fixture = setup({
        boardResponse: of(board([])),
        history: of({
          items: [{ id: '4821' } as ServiceOrder],
          pagination: { page: 1, perPage: 100, total: 1 },
        }),
      });
      const body = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

      expect(body).toContain('Sem picagem aberta e sem folha de obra em curso');
    });
  });

  it('reports a failed board request as an error', () => {
    const body = text(
      setup({ boardResponse: throwError(() => new ApiError(503, 'UPSTREAM', 'falhou')) }),
    );

    expect(body).toContain('Não foi possível carregar o registo');
  });
});
