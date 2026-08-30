/**
 * The table's own behaviour: sorting, row activation and the accessibility
 * wiring that would otherwise be easy to lose in a refactor.
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DataTable } from './data-table';
import type { TableColumn } from './data-table.model';

interface Row {
  readonly id: string;
  readonly name: string;
  readonly total: number | undefined;
  readonly status: string;
}

const ROWS: readonly Row[] = [
  { id: '1', name: 'Bruno', total: 30, status: 'Concluído' },
  { id: '2', name: 'Ana', total: undefined, status: 'Pendente' },
  { id: '3', name: 'Álvaro', total: 10, status: 'Cancelado' },
];

const COLUMNS: readonly TableColumn<Row>[] = [
  {
    key: 'name',
    header: 'Nome',
    value: (row) => row.name,
    sortValue: (row) => row.name,
    priority: 'primary',
  },
  {
    key: 'total',
    header: 'Total',
    value: (row) => (row.total === undefined ? null : String(row.total)),
    sortValue: (row) => row.total ?? null,
    align: 'end',
  },
  { key: 'status', header: 'Estado', value: (row) => row.status, badge: true },
  { key: 'secret', header: 'Oculto', value: () => 'nunca', priority: 'hidden' },
];

@Component({
  imports: [DataTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-data-table
      [columns]="columns"
      [rows]="rows()"
      [rowKey]="rowKey"
      [rowLink]="rowLink"
      [rowLabel]="rowLabel"
      caption="Lista de teste"
    />
  `,
})
class Host {
  readonly columns = COLUMNS;
  readonly rows = signal(ROWS);
  readonly rowKey = (row: Row): string => row.id;
  readonly rowLink = (row: Row): string => `/gestao/clientes/${row.id}`;
  readonly rowLabel = (row: Row): string => `Ver ${row.name}`;
}

@Component({
  imports: [DataTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-data-table [columns]="columns" [rows]="rows" [rowKey]="rowKey" caption="Só leitura" />
  `,
})
class ReadOnlyHost {
  readonly columns = COLUMNS;
  readonly rows = ROWS;
  readonly rowKey = (row: Row): string => row.id;
}

function render() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

/** The first column's text, in the order the table renders it. */
function names(fixture: ReturnType<typeof render>): string[] {
  return [...fixture.nativeElement.querySelectorAll('tbody tr')].map((row) =>
    (row as HTMLElement).querySelector('td')!.textContent!.trim(),
  );
}

function sortButton(fixture: ReturnType<typeof render>, index: number): HTMLButtonElement {
  return fixture.nativeElement.querySelectorAll('thead th button')[index] as HTMLButtonElement;
}

describe('DataTable', () => {
  it('renders one row per record and hides `hidden` columns', () => {
    const fixture = render();

    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('table')!.textContent).not.toContain('nunca');
  });

  it('renders a caption for screen readers', () => {
    const fixture = render();

    expect(fixture.nativeElement.querySelector('caption')!.textContent).toContain('Lista de teste');
  });

  it('renders a badge for badge columns', () => {
    const fixture = render();

    expect(fixture.nativeElement.querySelector('app-status-badge')).toBeTruthy();
  });

  describe('sorting', () => {
    it('sorts ascending, then descending, then returns to the original order', () => {
      const fixture = render();
      expect(names(fixture)).toEqual(['Bruno', 'Ana', 'Álvaro']);

      sortButton(fixture, 0).click();
      fixture.detectChanges();
      // Portuguese collation: "Álvaro" files with A, not after Z.
      expect(names(fixture)).toEqual(['Álvaro', 'Ana', 'Bruno']);

      sortButton(fixture, 0).click();
      fixture.detectChanges();
      expect(names(fixture)).toEqual(['Bruno', 'Ana', 'Álvaro']);

      // The third click clears the sort, which is otherwise unreachable.
      sortButton(fixture, 0).click();
      fixture.detectChanges();
      expect(names(fixture)).toEqual(['Bruno', 'Ana', 'Álvaro']);
    });

    it('sorts missing values last, in both directions', () => {
      const fixture = render();

      sortButton(fixture, 1).click();
      fixture.detectChanges();
      expect(names(fixture)).toEqual(['Álvaro', 'Bruno', 'Ana']);

      sortButton(fixture, 1).click();
      fixture.detectChanges();
      expect(names(fixture)).toEqual(['Bruno', 'Álvaro', 'Ana']);
    });

    it('announces the sort state through aria-sort', () => {
      const fixture = render();
      const header = fixture.nativeElement.querySelectorAll('thead th')[0] as HTMLElement;

      expect(header.getAttribute('aria-sort')).toBe('none');

      sortButton(fixture, 0).click();
      fixture.detectChanges();
      expect(header.getAttribute('aria-sort')).toBe('ascending');
    });

    it('offers no sort control on a column without a sort value', () => {
      const fixture = render();
      const headers = fixture.nativeElement.querySelectorAll('thead th') as NodeListOf<HTMLElement>;

      expect(headers[2].querySelector('button')).toBeNull();
      expect(headers[2].getAttribute('aria-sort')).toBeNull();
    });

    // The rows input belongs to the store, which treats it as immutable.
    it('does not mutate the input array', () => {
      const fixture = render();
      const before = [...fixture.componentInstance.rows()];

      sortButton(fixture, 0).click();
      fixture.detectChanges();

      expect(fixture.componentInstance.rows()).toEqual(before);
    });
  });

  describe('row navigation', () => {
    // `role="link"` on a `<tr>` overrides its implicit `row` role and drops it
    // out of the table's accessibility tree — the structure a screen-reader
    // user relies on. A real anchor in the primary cell is the correct pattern.
    it('never overrides the row or cell roles', () => {
      const fixture = render();
      const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;

      expect(row.getAttribute('role')).toBeNull();
      expect(row.getAttribute('tabindex')).toBeNull();
    });

    it('renders a real link in the primary cell', () => {
      const fixture = render();
      const link = fixture.nativeElement.querySelector('tbody tr a') as HTMLAnchorElement;

      expect(link).toBeTruthy();
      // A real href is what makes middle-click and "open in new tab" work.
      expect(link.getAttribute('href')).toBe('/gestao/clientes/1');
      expect(link.getAttribute('aria-label')).toBe('Ver Bruno');
      expect(link.textContent!.trim()).toBe('Bruno');
    });

    it('makes each mobile card a single anchor', () => {
      const fixture = render();
      const cards = fixture.nativeElement.querySelectorAll('ul[role="list"] > li');
      const anchor = (cards[0] as HTMLElement).querySelector('a') as HTMLAnchorElement;

      expect(anchor.getAttribute('href')).toBe('/gestao/clientes/1');
      expect((cards[0] as HTMLElement).getAttribute('role')).toBeNull();
    });

    it('renders no link at all when the list is read-only', () => {
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(ReadOnlyHost);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('tbody tr a')).toBeNull();
      expect(fixture.nativeElement.querySelector('tbody tr')!.getAttribute('role')).toBeNull();
    });
  });

  it('renders a card list as well, for narrow viewports', () => {
    const fixture = render();

    // Both layouts are in the DOM; CSS decides which is shown, so the mobile
    // one cannot silently disappear from the markup.
    expect(fixture.nativeElement.querySelectorAll('ul[role="list"] > li')).toHaveLength(3);
  });

  it('shows a dash rather than an empty cell for a missing value', () => {
    const fixture = render();
    const anaRow = [...fixture.nativeElement.querySelectorAll('tbody tr')].find((row) =>
      (row as HTMLElement).textContent!.includes('Ana'),
    ) as HTMLElement;

    expect(anaRow.querySelectorAll('td')[1].textContent!.trim()).toBe('—');
  });
});
