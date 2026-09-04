/**
 * The calendar's arithmetic, which is where a month grid actually goes wrong:
 * which day a timed event lands on, where the weeks start, and whether paging
 * survives the end of a long month.
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Calendar } from './calendar';
import type { CalendarEvent } from './calendar.model';

@Component({
  imports: [Calendar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-calendar
      [month]="month()"
      [events]="events()"
      [maxPerDay]="maxPerDay()"
      (monthChange)="month.set($event)"
      (selectEvent)="picked.set($event)"
    />
  `,
})
class Host {
  readonly month = signal(new Date(2026, 8, 1)); // September 2026
  readonly events = signal<readonly CalendarEvent[]>([]);
  readonly maxPerDay = signal(3);
  readonly picked = signal<CalendarEvent | null>(null);
}

function render() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

/** Every day cell, in render order. */
function cells(fixture: ReturnType<typeof render>): HTMLElement[] {
  return [...fixture.nativeElement.querySelectorAll('tbody td')] as HTMLElement[];
}

/** The cell showing `day` of the displayed month, found by its own events. */
function cellWithText(fixture: ReturnType<typeof render>, text: string): HTMLElement | undefined {
  return cells(fixture).find((cell) => cell.textContent?.includes(text));
}

describe('Calendar', () => {
  it('always draws six whole weeks, so the grid does not resize between months', () => {
    const fixture = render();

    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(cells(fixture)).toHaveLength(42);
  });

  it('starts each week on Monday', () => {
    const fixture = render();
    const headers = [...fixture.nativeElement.querySelectorAll('thead th')].map((th) =>
      (th as HTMLElement).textContent!.trim(),
    );

    expect(headers).toEqual(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']);

    // 1 September 2026 is a Tuesday, so the grid opens on Monday 31 August.
    expect(cells(fixture)[0]!.textContent).toContain('31');
  });

  /**
   * The regression this component was written to avoid: grouping on the ISO
   * string's first ten characters buckets by UTC day, which is the wrong day
   * for anything late in the evening during Lisbon summer time.
   */
  it('places an event on its local day, not its UTC day', () => {
    const fixture = render();

    // 23:30Z on 9 September is 00:30 on the 10th in Lisbon (UTC+1 in summer).
    fixture.componentInstance.events.set([
      { id: 'a', startsAt: '2026-09-09T23:30:00Z', title: 'Revisão tardia' },
    ]);
    fixture.detectChanges();

    const cell = cellWithText(fixture, 'Revisão tardia');
    const localDay = new Date('2026-09-09T23:30:00Z').getDate();

    expect(cell).toBeDefined();
    expect(cell!.textContent).toContain(String(localDay));
  });

  it('orders a day’s events by time', () => {
    const fixture = render();

    fixture.componentInstance.events.set([
      { id: 'late', startsAt: '2026-09-15T16:00:00Z', title: 'Segunda' },
      { id: 'early', startsAt: '2026-09-15T08:00:00Z', title: 'Primeira' },
    ]);
    fixture.detectChanges();

    const cell = cellWithText(fixture, 'Primeira')!;
    const labels = [...cell.querySelectorAll('button')].map((b) => b.textContent!);

    expect(labels[0]).toContain('Primeira');
    expect(labels[1]).toContain('Segunda');
  });

  it('collapses the overflow of a busy day into a count', () => {
    const fixture = render();

    fixture.componentInstance.events.set(
      Array.from({ length: 5 }, (_, index) => ({
        id: `e${index}`,
        startsAt: `2026-09-15T0${index + 1}:00:00Z`,
        title: `Marcação ${index}`,
      })),
    );
    fixture.detectChanges();

    const cell = cellWithText(fixture, 'Marcação 0')!;

    expect(cell.querySelectorAll('button')).toHaveLength(3);
    expect(cell.textContent).toContain('+2 mais');
  });

  it('drops an event whose instant will not parse rather than misplacing it', () => {
    const fixture = render();

    fixture.componentInstance.events.set([{ id: 'x', startsAt: '', title: 'Sem data' }]);
    fixture.detectChanges();

    expect(cellWithText(fixture, 'Sem data')).toBeUndefined();
  });

  it('emits the event that was clicked', () => {
    const fixture = render();

    fixture.componentInstance.events.set([
      { id: 'a1', startsAt: '2026-09-15T09:00:00Z', title: 'Alinhamento' },
    ]);
    fixture.detectChanges();

    cellWithText(fixture, 'Alinhamento')!.querySelector('button')!.click();

    expect(fixture.componentInstance.picked()?.id).toBe('a1');
  });

  describe('paging', () => {
    /** `new Date(2026, 0, 31)` + 1 month is 3 March, not February. */
    it('steps whole months from a 31-day month without overshooting', () => {
      const fixture = render();
      fixture.componentInstance.month.set(new Date(2026, 0, 31)); // 31 January
      fixture.detectChanges();

      next(fixture).click();
      fixture.detectChanges();

      expect(fixture.componentInstance.month().getMonth()).toBe(1); // February
      expect(fixture.componentInstance.month().getDate()).toBe(1);
    });

    it('goes back a month', () => {
      const fixture = render();

      previous(fixture).click();
      fixture.detectChanges();

      expect(fixture.componentInstance.month().getMonth()).toBe(7); // August
    });

    it('disables "Hoje" while the current month is already shown', () => {
      const fixture = render();
      fixture.componentInstance.month.set(new Date());
      fixture.detectChanges();

      expect(today(fixture).disabled).toBe(true);
    });
  });
});

function button(fixture: ReturnType<typeof render>, label: string): HTMLButtonElement {
  return [...fixture.nativeElement.querySelectorAll('button')].find((element) =>
    (element as HTMLElement).textContent?.includes(label),
  ) as HTMLButtonElement;
}

const previous = (f: ReturnType<typeof render>) => button(f, 'Mês anterior');
const next = (f: ReturnType<typeof render>) => button(f, 'Mês seguinte');
const today = (f: ReturnType<typeof render>) => button(f, 'Hoje');
