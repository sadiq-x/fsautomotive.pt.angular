/**
 * The live board.
 *
 * Two properties matter more than anything the template renders, and both are
 * about what happens when things go wrong:
 *
 *  1. A failed poll must not clear the screen. A board that blanks itself on a
 *     network hiccup leaves a mechanic unable to tell "no cars" from "no
 *     connection", which is the one thing a board must never be ambiguous about.
 *  2. Cars on the board with nobody clocked on must be explained rather than
 *     rendered as a wall of blank timers. That is this tenant's real situation.
 */
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, of, throwError, type Observable } from 'rxjs';

import { ApiError } from '../../../../../core/models/api.model';
import type { MonitorBoard, MonitorServiceOrder } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { Monitor } from './monitor';

const OBSERVED_AT = '2026-09-13T10:00:00.000Z';

function card(id: string, overrides: Partial<MonitorServiceOrder> = {}): MonitorServiceOrder {
  return {
    id,
    plate: '61SQ64',
    status: 'ESP',
    interventions: [],
    mechanics: [],
    ...overrides,
  };
}

function board(
  serviceOrders: readonly MonitorServiceOrder[],
  activeMechanicCount = 0,
  roster: MonitorBoard['roster'] = [],
): MonitorBoard {
  return { serviceOrders, roster, observedAt: OBSERVED_AT, activeMechanicCount };
}

/**
 * A backend that answers differently on each poll.
 *
 * Takes a list rather than one value because every interesting property here is
 * about the *second* response — the failure after a success, the recovery after
 * a failure. The last entry repeats once the list runs out.
 */
function setup(responses: readonly Observable<MonitorBoard>[]) {
  let call = 0;

  const officegest = {
    getWorkshopBoard: () => {
      const response = responses[Math.min(call, responses.length - 1)];
      call += 1;
      return response;
    },
  };

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: OfficeGestService, useValue: officegest },
    ],
  });

  const fixture = TestBed.createComponent(Monitor);
  fixture.detectChanges();

  return fixture;
}

function text(fixture: ReturnType<typeof setup>): string {
  return (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ').trim();
}

/**
 * Cards are counted inside the board section only.
 *
 * Each card is an anchor — the whole card is the link — and the mechanics
 * panel above is made of anchors too, so an unscoped query would count both
 * and quietly pass whatever the board did.
 */
function cardCount(fixture: ReturnType<typeof setup>): number {
  return fixture.nativeElement.querySelectorAll('section[aria-labelledby="quadro"] a').length;
}

const POLL_MS = 20_000;

describe('Monitor', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders a card for each active job', () => {
    const fixture = setup([of(board([card('1'), card('2')]))]);

    expect(cardCount(fixture)).toBe(2);
  });

  it('says so plainly when the workshop has nothing in progress', () => {
    const fixture = setup([of(board([]))]);

    expect(text(fixture)).toContain('Nenhuma viatura em curso');
  });

  /**
   * The finding this whole feature ran into: the board is full and no timer is
   * running, because nobody clocks on. An unexplained screen of blanks reads as
   * a broken page.
   */
  it('explains a board where nobody has clocked on', () => {
    const fixture = setup([of(board([card('1')], 0))]);

    expect(text(fixture)).toContain('Nenhum mecânico tem picagem aberta');
  });

  it('does not explain anything once somebody is clocked on', () => {
    const fixture = setup([
      of(
        board(
          [card('1', { mechanics: [{ employeeCode: '7', name: 'João', startedAt: OBSERVED_AT }] })],
          1,
        ),
      ),
    ]);

    expect(text(fixture)).not.toContain('picagem aberta');
  });

  describe('the refresh control', () => {
    /** The spinner starts when the poll leaves, not when it lands. */
    it('turns while a poll is in flight', () => {
      // A board that never resolves leaves the request outstanding.
      const fixture = setup([NEVER]);
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.disabled).toBe(true);
      expect((button.querySelector('app-icon') as HTMLElement).className).toContain('animate-spin');
    });

    it('stops turning once the board arrives', () => {
      const fixture = setup([of(board([card('1')]))]);
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

      expect(button.getAttribute('aria-busy')).toBeNull();
      expect(button.disabled).toBe(false);
    });

    /** A failed poll is finished work: the control must not spin for ever. */
    it('stops turning after a failed poll', () => {
      const fixture = setup([
        of(board([card('1')])),
        throwError(() => new ApiError(503, 'UPSTREAM', 'falhou')),
      ]);

      vi.advanceTimersByTime(POLL_MS);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

      expect(button.getAttribute('aria-busy')).toBeNull();
    });
  });

  describe('opening a card', () => {
    /**
     * The board's card id is the work order's `number`, which is what the
     * detail endpoint is keyed on — verified against eight live cards. So a
     * card links straight to the existing page instead of needing its own.
     */
    it('links each card to its work order', () => {
      const fixture = setup([of(board([card('4821')]))]);
      const link = fixture.nativeElement.querySelector(
        'section[aria-labelledby="quadro"] a',
      ) as HTMLAnchorElement;

      expect(link.getAttribute('href')).toBe('/private/service-orders/4821');
    });

    /** A card is a link, so it must say where it goes when read aloud. */
    it('labels the card link with the plate', () => {
      const fixture = setup([of(board([card('4821', { plate: '61SQ64' })]))]);
      const link = fixture.nativeElement.querySelector(
        'section[aria-labelledby="quadro"] a',
      ) as HTMLAnchorElement;

      expect(link.getAttribute('aria-label')).toBe('Ver a folha de obra 61-SQ-64');
    });
  });

  describe('the mechanics panel', () => {
    /** The question this view exists to answer: where is each person. */
    it('names the car each mechanic is working on', () => {
      const fixture = setup([
        of(
          board(
            [
              card('4821', {
                plate: '61SQ64',
                mechanics: [{ employeeCode: '7', name: 'João', startedAt: OBSERVED_AT }],
              }),
            ],
            1,
            [{ employeeCode: '7', name: 'João' }],
          ),
        ),
      ]);

      const panel = fixture.nativeElement.querySelector('section[aria-labelledby="mecanicos"]');

      expect(panel.textContent).toContain('João');
      expect(panel.textContent).toContain('61-SQ-64');
    });

    /** This tenant's real state: the five names appear, each marked free. */
    it('lists a mechanic who is on nothing as free', () => {
      const fixture = setup([of(board([card('1')], 0, [{ employeeCode: '7', name: 'João' }]))]);

      const panel = fixture.nativeElement.querySelector('section[aria-labelledby="mecanicos"]');

      expect(panel.textContent).toContain('João');
      expect(panel.textContent).toContain('Livre');
    });

    /** An empty panel would read as a fault; no panel reads as nothing to say. */
    it('renders no panel at all when there is nobody to list', () => {
      const fixture = setup([of(board([card('1')], 0, []))]);

      expect(
        fixture.nativeElement.querySelector('section[aria-labelledby="mecanicos"]'),
      ).toBeNull();
    });
  });

  describe('when a poll fails', () => {
    const failure = throwError(() => new ApiError(503, 'UPSTREAM', 'O OfficeGest não respondeu.'));

    it('keeps the last board on screen instead of clearing it', () => {
      const fixture = setup([of(board([card('1'), card('2')])), failure]);

      vi.advanceTimersByTime(POLL_MS);
      fixture.detectChanges();

      expect(cardCount(fixture)).toBe(2);
    });

    it('warns that what is on screen is no longer current', () => {
      const fixture = setup([of(board([card('1')])), failure]);

      vi.advanceTimersByTime(POLL_MS);
      fixture.detectChanges();

      expect(text(fixture)).toContain('O OfficeGest não respondeu.');
      expect(text(fixture)).toContain('últimos recebidos');
    });

    /** With nothing ever fetched there is no last-known state to fall back on. */
    it('shows the error state when the very first poll fails', () => {
      const fixture = setup([failure]);

      expect(cardCount(fixture)).toBe(0);
      expect(text(fixture)).toContain('Tentar novamente');
    });

    it('clears the warning once a later poll succeeds', () => {
      const fixture = setup([of(board([card('1')])), failure, of(board([card('1'), card('2')]))]);

      vi.advanceTimersByTime(POLL_MS);
      fixture.detectChanges();
      vi.advanceTimersByTime(POLL_MS);
      fixture.detectChanges();

      expect(text(fixture)).not.toContain('últimos recebidos');
      expect(cardCount(fixture)).toBe(2);
    });
  });

  it('refetches on its own without anyone touching the page', () => {
    const fixture = setup([of(board([card('1')])), of(board([card('1'), card('2')]))]);

    expect(cardCount(fixture)).toBe(1);

    vi.advanceTimersByTime(POLL_MS);
    fixture.detectChanges();

    expect(cardCount(fixture)).toBe(2);
  });
});
