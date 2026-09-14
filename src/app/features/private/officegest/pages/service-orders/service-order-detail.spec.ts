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
import { of, type Observable } from 'rxjs';

import type { MonitorBoard, MonitorServiceOrder, ServiceOrder } from '../../models';
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
}

function setup(options: Options = {}) {
  const officegest = {
    getServiceOrder: () => of(options.order ?? order()),
    getWorkshopBoard: () => options.board ?? of(board([liveRow()])),
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
    it('does not claim an age for a job that is no longer on the board', () => {
      const body = text(setup({ board: of(board([])) }));

      expect(body).not.toContain('Aberta há');
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

    it('sums the estimated time from the price list', () => {
      // 30 + 90 minutes.
      expect(text(setup())).toContain('Tempo estimado: 2 h 00 min');
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

    /** The one fact the screen cannot show, said in words rather than implied. */
    it('says that OfficeGest records no completion time', () => {
      expect(text(setup())).toContain('não a hora de fecho');
    });
  });
});
