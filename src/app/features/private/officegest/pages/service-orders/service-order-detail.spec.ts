/**
 * One work order's page.
 *
 * Two of these pin bugs that were live on this screen: every billed line showed
 * a **net** figure in a column headed "Total", and a "Fecho" row read a field
 * OfficeGest has never sent. The rest pin the boundary this page has to make
 * visible — live work is knowable, a finished repair's duration is not.
 */
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, type Observable } from 'rxjs';

import type {
  MonitorBoard,
  MonitorServiceOrder,
  ServiceOrder,
  ServiceOrderTimeEntry,
} from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { ServiceOrderDetail } from './service-order-detail';

const ORDER_ID = '25143';

function order(overrides: Partial<ServiceOrder> = {}): ServiceOrder {
  return {
    id: ORDER_ID,
    number: 'FO 2026/143',
    status: 'ESP',
    plate: 'AA00BB',
    customerName: 'Ana Silva',
    openedAt: '2026-09-01T00:00:00.000Z',
    total: 184.5,
    ...overrides,
  };
}

function liveRow(overrides: Partial<MonitorServiceOrder> = {}): MonitorServiceOrder {
  return {
    id: ORDER_ID,
    status: 'EXE',
    plate: 'AA00BB',
    // Real monitor rows carry this (mapped from `date`); the board average is
    // computed from it, so a fixture without one silently has nothing to average.
    openedAt: '2026-09-01T00:00:00.000Z',
    completionPercentage: 0.4,
    interventions: [
      { name: 'Mudança de óleo', completed: false, estimatedMinutes: 30 },
      { name: 'Travões', completed: true, estimatedMinutes: 90 },
    ],
    mechanics: [{ employeeCode: '7', name: 'João', startedAt: '2026-09-13T08:15:00.000Z' }],
    ...overrides,
  };
}

function board(rows: readonly MonitorServiceOrder[]): MonitorBoard {
  return {
    serviceOrders: rows,
    roster: [],
    observedAt: '2026-09-13T10:00:00.000Z',
    activeMechanicCount: rows.filter((r) => r.mechanics.length > 0).length,
  };
}

interface Options {
  readonly order?: ServiceOrder;
  readonly board?: Observable<MonitorBoard>;
  readonly monitorOrder?: Observable<MonitorServiceOrder | null>;
  readonly times?: Observable<readonly ServiceOrderTimeEntry[]>;
  /** Called once per poll, for tests that need successive polls to differ. */
  readonly boardCall?: () => Observable<MonitorBoard>;
}

function setup(options: Options = {}) {
  const officegest = {
    getServiceOrder: () => of(options.order ?? order()),
    getWorkshopBoard: options.boardCall ?? (() => options.board ?? of(board([liveRow()]))),
    getWorkshopMonitorOrder: () => options.monitorOrder ?? of(null),
    getServiceOrderTimes: () => options.times ?? of([]),
    employeeNames: () => of(new Map<string, string>()),
  };

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: OfficeGestService, useValue: officegest },
    ],
  });

  const fixture = TestBed.createComponent(ServiceOrderDetail);
  fixture.componentRef.setInput('serviceOrderId', ORDER_ID);
  fixture.detectChanges();

  return fixture;
}

function text(fixture: ReturnType<typeof setup>): string {
  return (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ').trim();
}

describe('ServiceOrderDetail', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-13T10:00:00.000Z'));
  });

  afterEach(() => vi.useRealTimers());

  describe('the billed lines', () => {
    const withLine = order({
      lines: [
        {
          id: '1',
          description: 'Pastilhas',
          quantity: 4,
          unitPrice: 12.5,
          vatPercentage: 23,
          discountPercentage: 0,
          totalWithoutVat: 50,
          vatValue: 11.5,
          total: 61.5,
        },
      ],
    });

    /**
     * The bug: this column read `total_without_vat` and was headed "Total"
     * under a model that documented it as including VAT.
     */
    it('shows the gross total, not the net, in the total column', () => {
      const body = text(setup({ order: withLine }));

      expect(body).toContain('61,50');
      expect(body).toContain('50,00');
      expect(body).toContain('11,50');
    });

    it('shows the VAT rate and the discount for each line', () => {
      const body = text(setup({ order: withLine }));

      expect(body).toContain('23 %');
      // Zero is rendered, not dropped: "no discount" and "nobody recorded a
      // discount" are different statements on an invoice.
      expect(body).toContain('0 %');
    });

    it('adds the columns up in a totals row', () => {
      const fixture = setup({ order: withLine });
      const foot = fixture.nativeElement.querySelector('tfoot') as HTMLElement;

      expect(foot.textContent?.replace(/\s+/g, ' ')).toContain('61,50');
    });

    /**
     * The regression this pins: order 202600642's `total` field is `6.03`,
     * which is not this job's cost — it is exactly one line's gross, while the
     * real billed total (nine more lines the order's own `total` never
     * counted) is `409.54`. The top "Total" field used to read that broken
     * field directly; it must now agree with the billed-lines table instead.
     */
    it("shows the billed-lines total in the field list, not the order's own (unreliable) total", () => {
      const body = text(
        setup({ order: order({ total: 6.03, lines: withLine.lines }) }),
      );

      expect(body).toContain('61,50');
      expect(body).not.toContain('6,03');
    });

    it('omits the Total field entirely when there are no billed lines to sum', () => {
      // The default fixture carries `total: 184.5` but no `lines` — showing
      // that number would be the exact bug this fix removes.
      const body = text(setup());

      expect(body).not.toContain('184,50');
    });
  });

  describe('the Tempos section', () => {
    /**
     * Man-hours, not wall-clock: two mechanics on a car for an hour is two
     * hours of work, which is what a labour figure means.
     */
    it('sums the worked time across everyone clocked on', () => {
      const body = text(
        setup({
          board: of(
            board([
              liveRow({
                mechanics: [
                  { employeeCode: '7', startedAt: '2026-09-13T09:00:00.000Z' },
                  { employeeCode: '8', startedAt: '2026-09-13T09:30:00.000Z' },
                ],
              }),
            ]),
          ),
        }),
      );

      // 1 h + 30 min against a snapshot at 10:00.
      expect(body).toContain('1 h 30 min');
    });

    /** The common case here: a job on the board that nobody has picado. */
    it('says why there is no worked time rather than showing a blank', () => {
      const body = text(setup({ board: of(board([liveRow({ mechanics: [] })])) }));

      expect(body).toContain('Sem picagem aberta');
    });

    it('reports how much of the estimate has been used', () => {
      const body = text(
        setup({
          board: of(
            board([
              liveRow({
                // 2 h estimated, 1 h worked.
                interventions: [{ name: 'Revisão', completed: false, estimatedMinutes: 120 }],
                mechanics: [{ employeeCode: '7', startedAt: '2026-09-13T09:00:00.000Z' }],
              }),
            ]),
          ),
        }),
      );

      expect(body).toContain('50% do estimado consumido');
    });

    /** Dividing by a zero estimate would render an infinite percentage. */
    it('shows no percentage when there is no estimate to measure against', () => {
      const body = text(
        setup({
          board: of(
            board([
              liveRow({
                interventions: [{ name: 'Revisão', completed: false }],
                mechanics: [{ employeeCode: '7', startedAt: '2026-09-13T09:00:00.000Z' }],
              }),
            ]),
          ),
        }),
      );

      expect(body).not.toContain('do estimado consumido');
    });

    it('shows how long the job has been open, against the board average', () => {
      const body = text(setup());

      // Opened 2026-09-01, board observed 2026-09-13.
      expect(body).toContain('Aberta há');
      expect(body).toContain('12 dias');
      expect(body).toContain('Média das folhas em curso');
    });

    /**
     * The restriction that keeps this honest: with no completion timestamp,
     * "aberta há 150 dias" on a job that has left the board is a true sentence
     * that reads as a false one.
     */
    it('explains rather than claims an age for a job that is no longer on the board', () => {
      const body = text(setup({ board: of(board([])) }));

      // The label stays — silence would look like a missing field rather than
      // a deliberate one — but no number is shown, and the reason is stated.
      expect(body).toContain('Aberta há —');
      expect(body).toContain('Só é calculada enquanto a folha está em curso no quadro da oficina');
    });

    it('reports how late an open job is against its promised delivery', () => {
      const body = text(
        setup({
          order: order({ expectedDeliveryAt: '2026-09-10T00:00:00.000Z' }),
        }),
      );

      expect(body).toContain('Atraso');
      expect(body).toContain('3 dias');
    });

    it('reports no delay while the promised date is still ahead', () => {
      const body = text(
        setup({ order: order({ expectedDeliveryAt: '2026-09-20T00:00:00.000Z' }) }),
      );

      expect(body).not.toContain('Atraso');
    });
  });

  /** OfficeGest publishes no completion timestamp, so the row is gone. */
  it('shows no closing-date row', () => {
    expect(text(setup())).not.toContain('Fecho');
  });

  describe('work in progress', () => {
    it('shows the mechanic and a running timer while the job is open', () => {
      const body = text(setup());

      expect(body).toContain('Trabalho em curso');
      expect(body).toContain('João');
      // Clocked on at 08:15, board observed at 10:00.
      expect(body).toContain('1h 45m');
    });

    it('sums the estimated time from the price list when the order carries none of its own', () => {
      // 30 + 90 minutes, from the monitor-catalogue fallback.
      expect(text(setup())).toContain('Tempo estimado: 2 h 00 min');
    });

    /**
     * The regression this pins: order 202600642's own interventions summed to
     * 480 real minutes, and the page was instead using a name-matched
     * catalogue join that only found 33 — an order of magnitude off, and the
     * reason "% do estimado consumido" once read 1827%.
     */
    it("prefers the order's own estimated time over the monitor-catalogue join", () => {
      // The order says 480; the live board's catalogue join would say 120 (30+90).
      const body = text(setup({ order: order({ estimatedMinutes: 480 }) }));

      expect(body).toContain('Tempo estimado: 8 h 00 min');
      expect(body).not.toContain('2 h 00 min');
    });

    it("still shows the order's own estimated time for a closed job, off the board", () => {
      const body = text(
        setup({ order: order({ estimatedMinutes: 480 }), board: of(board([])) }),
      );

      // No "Trabalho em curso" subtitle here (the job is off the board), so
      // this is the Tempos grid's own dt/dd pair, not the colon-joined form.
      expect(body).toContain('Tempo estimado 8 h 00 min');
    });

    it('shows the mechanic’s actual clock-on time beside the running timer', () => {
      const body = text(setup());

      // 08:15 UTC, rendered in the pt-PT/Lisbon locale (UTC+1 in September).
      expect(body).toContain('desde 13/09/2026, 09:15');
    });

    /** Removed: this field never showed a value on this tenant (see git history). */
    it('no longer shows a "Fim previsto" field at all', () => {
      expect(text(setup())).not.toContain('Fim previsto');
    });

    /**
     * The reason `orderSnapshot` exists on the backend: a closed order drops
     * off the active board for good, so its mechanic clock-on can only be
     * read from its full-history monitor record.
     */
    describe('once the job has closed', () => {
      function closedRow(): MonitorServiceOrder {
        return liveRow({
          mechanics: [
            { employeeCode: '7', name: 'João', startedAt: '2026-09-13T08:15:00.000Z' },
          ],
        });
      }

      it('falls back to the historical record and shows a plain clock-on time, not a ticking one', () => {
        const body = text(
          setup({ board: of(board([])), monitorOrder: of(closedRow()) }),
        );

        expect(body).toContain('Registo de picagens');
        expect(body).toContain('João');
        expect(body).toContain('Início: 13/09/2026, 09:15');
        // No live board behind it, so no "time ago" reading is claimed.
        expect(body).not.toContain('Trabalho em curso');
      });

      it('still sums the estimated time from the historical record', () => {
        const body = text(setup({ board: of(board([])), monitorOrder: of(closedRow()) }));

        expect(body).toContain('Tempo estimado: 2 h 00 min');
      });

      it('does not claim the job is open just because history exists for it', () => {
        const body = text(setup({ board: of(board([])), monitorOrder: of(closedRow()) }));

        // The label is explained, not a real age — historical monitor data
        // does not make a closed job "currently open" again.
        expect(body).toContain('Aberta há —');
        expect(body).not.toContain('Atraso');
      });
    });

    it('lists the interventions and marks the completed ones', () => {
      const body = text(setup());

      expect(body).toContain('Mudança de óleo');
      expect(body).toContain('Travões');
      expect(body).toContain('concluída');
    });

    /** A finished repair has no live row, and no section — not a row of dashes. */
    it('shows no live section once the job is off the board', () => {
      const body = text(setup({ board: of(board([])) }));

      expect(body).not.toContain('Trabalho em curso');
    });

    /** The page must work without the board; the section is an extra. */
    it('still renders the order when the board cannot be read', () => {
      const body = text(setup({ board: of(board([])) }));

      expect(body).toContain('FO 2026/143');
      expect(body).toContain('Ana Silva');
    });

    /** The board's own limit, said in words rather than implied. */
    it('says the monitor board itself carries no close time', () => {
      expect(text(setup())).toContain('sem hora de fecho');
    });
  });

  describe('Registo de horas', () => {
    function timeEntry(overrides: Partial<ServiceOrderTimeEntry> = {}): ServiceOrderTimeEntry {
      return {
        id: '1',
        employeeId: '7',
        employeeName: 'João Silva',
        startedAt: '2026-09-13T08:00:00.000Z',
        endedAt: '2026-09-13T09:30:00.000Z',
        workedMinutes: 90,
        ...overrides,
      };
    }

    it('is absent when the order has no logged time entries', () => {
      expect(text(setup())).not.toContain('Registo de horas');
    });

    it('lists a real start and end, and the mechanic name straight off the entry', () => {
      const body = text(setup({ times: of([timeEntry()]) }));

      expect(body).toContain('Registo de horas');
      expect(body).toContain('João Silva');
      // 08:00/09:30 UTC, rendered in the pt-PT/Lisbon locale (UTC+1 in September).
      expect(body).toContain('13/09/2026, 09:00');
      expect(body).toContain('13/09/2026, 10:30');
      expect(body).toContain('1 h 30 min');
    });

    it('shows an entry with no end as still in progress, not a dash', () => {
      const body = text(
        setup({ times: of([timeEntry({ endedAt: undefined, workedMinutes: undefined })]) }),
      );

      expect(body).toContain('Em curso');
    });

    it('totals the logged minutes across every entry', () => {
      const body = text(
        setup({
          times: of([
            timeEntry({ id: '1', workedMinutes: 90 }),
            timeEntry({ id: '2', employeeId: '8', employeeName: 'Rui', workedMinutes: 30 }),
          ]),
        }),
      );

      expect(body).toContain('2 h 00 min');
    });

    /** The logged total is real for a closed job too, so it must win over "no live timer". */
    it('shows the logged total as the worked time even when the job is off the board', () => {
      const body = text(
        setup({ board: of(board([])), times: of([timeEntry({ workedMinutes: 90 })]) }),
      );

      expect(body).toContain('Tempo trabalhado');
      expect(body).toContain('1 h 30 min');
      expect(body).toContain('Soma do registo de horas');
    });
  });

  describe('mechanics who worked the order', () => {
    function timeEntry(overrides: Partial<ServiceOrderTimeEntry> = {}): ServiceOrderTimeEntry {
      return {
        id: '1',
        employeeId: '7',
        employeeName: 'João Silva',
        startedAt: '2026-09-13T08:00:00.000Z',
        endedAt: '2026-09-13T09:30:00.000Z',
        workedMinutes: 90,
        ...overrides,
      };
    }

    it('names everyone who logged time, not just the field the job is assigned to', () => {
      const body = text(
        setup({
          times: of([
            timeEntry({ id: '1', startedAt: '2026-09-13T08:00:00.000Z' }),
            timeEntry({
              id: '2',
              employeeId: '8',
              employeeName: 'Rui',
              startedAt: '2026-09-13T09:00:00.000Z',
            }),
          ]),
        }),
      );

      expect(body).toContain('Mecânicos que trabalharam');
      expect(body).toContain('João Silva, Rui');
    });

    it('lists each mechanic once in the summary, however many entries they logged', () => {
      const body = text(
        setup({
          times: of([
            timeEntry({ id: '1', startedAt: '2026-09-13T08:00:00.000Z' }),
            timeEntry({ id: '2', startedAt: '2026-09-13T10:00:00.000Z' }),
          ]),
        }),
      );

      // The table legitimately repeats the name once per session; the summary
      // field must not.
      expect(body).toContain('Mecânicos que trabalharam João Silva Abertura');
    });

    it('is absent when there is no logged time to name anyone from', () => {
      expect(text(setup())).not.toContain('Mecânicos que trabalharam');
    });

    it('still works for a closed order, off the active board', () => {
      const body = text(setup({ board: of(board([])), times: of([timeEntry()]) }));

      expect(body).toContain('Mecânicos que trabalharam');
      expect(body).toContain('João Silva');
    });
  });

  /**
   * The regression this pins: on 202600642 the header read the order's own
   * times (8 h 00 min) while each line read the catalogue's standard times
   * (18 min, 15 min, blanks) — a list that added up to 33 minutes under a
   * header of 480. The live fixture's catalogue times are 30 and 90.
   */
  describe('estimates come from one source at a time', () => {
    it("uses the order's own times for the header and every line when it has them", () => {
      const body = text(
        setup({ order: order({ estimatedMinutes: 75, interventionMinutes: [60, 15] }) }),
      );

      expect(body).toContain('Tempo estimado: 1 h 15 min');
      expect(body).toContain('por concluir 1 h 00 min');
      expect(body).toContain('concluída 15 min');
      // The catalogue's 90 for Travões must not appear beside the order's 15.
      expect(body).not.toContain('1 h 30 min');
      expect(body).not.toContain('Tempo padrão do catálogo');
    });

    it('shows no per-line time rather than a misaligned one when the lists differ in length', () => {
      const body = text(
        setup({ order: order({ estimatedMinutes: 60, interventionMinutes: [60] }) }),
      );

      expect(body).toContain('Tempo estimado: 1 h 00 min');
      expect(body).not.toContain('por concluir 1 h 00 min');
      expect(body).not.toContain('concluída 1 h 30 min');
    });

    it('falls back to the catalogue for both, and says so, when the order has no times', () => {
      const body = text(setup());

      expect(body).toContain('Tempo estimado: 2 h 00 min');
      expect(body).toContain('por concluir 30 min');
      expect(body).toContain('concluída 1 h 30 min');
      expect(body).toContain('Tempo padrão do catálogo');
    });
  });

  /** The monitor only knows who is clocked on now; closed sessions live in /times. */
  describe('the mechanic line when nobody is clocked on', () => {
    const idleBoard = () => of(board([liveRow({ mechanics: [] })]));

    it('says nobody is clocked on right now, not that nothing was ever registered', () => {
      const body = text(setup({ board: idleBoard() }));

      expect(body).toContain('Nenhum mecânico com picagem aberta neste momento.');
      expect(body).not.toContain('picagem registada');
    });

    it('points to the hours log when sessions have already been registered', () => {
      const body = text(
        setup({
          board: idleBoard(),
          times: of([
            {
              id: '1',
              employeeId: '7',
              employeeName: 'João Silva',
              startedAt: '2026-09-13T08:00:00.000Z',
              endedAt: '2026-09-13T09:30:00.000Z',
              workedMinutes: 90,
            },
          ]),
        }),
      );

      expect(body).toContain('As picagens já registadas estão no registo de horas abaixo.');
    });
  });

  /**
   * Audit 2026-09-26: one failed poll used to replace the board with `null`,
   * making an open job look closed for twenty seconds.
   */
  describe('a failed poll', () => {
    afterEach(() => vi.useRealTimers());

    it('keeps the last good board instead of treating the job as closed', () => {
      vi.useFakeTimers();
      let calls = 0;
      const fixture = setup({
        boardCall: () => (++calls === 1 ? of(board([liveRow()])) : throwError(() => new Error('503'))),
      });

      expect(text(fixture)).toContain('Trabalho em curso');

      vi.advanceTimersByTime(20_000);
      fixture.detectChanges();

      expect(calls).toBe(2);
      expect(text(fixture)).toContain('Trabalho em curso');
      expect(text(fixture)).not.toContain('Registo de picagens');
      expect(text(fixture)).toContain('Aberta há 12 dias');
    });
  });

  /** Audit 2026-09-26: labour is hours, not calendar days. */
  it('shows more than a day of logged work in hours, matching the hours log', () => {
    const body = text(
      setup({
        times: of([
          {
            id: '1',
            employeeId: '7',
            employeeName: 'João Silva',
            startedAt: '2026-09-13T08:00:00.000Z',
            endedAt: '2026-09-14T14:00:00.000Z',
            workedMinutes: 1800,
          },
        ]),
      }),
    );

    expect(body).toContain('Tempo trabalhado 30 h 00 min');
    expect(body).not.toContain('1 dia');
  });
});
