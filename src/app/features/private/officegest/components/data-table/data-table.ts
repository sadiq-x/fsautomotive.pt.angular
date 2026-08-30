/**
 * The one table in the private area.
 *
 * WHY A SINGLE COMPONENT
 * ----------------------
 * Customers, vehicles, service orders and appointments all need the same
 * scaffolding: a semantic `<table>`, an accessible sortable header, a keyboard
 * path to each row, a dimmed state while the next page loads, and a mobile
 * layout that is not a sideways scroll. Four copies would drift, and three of
 * them would lose the accessibility work.
 *
 * RESPONSIVE STRATEGY
 * -------------------
 * Below `lg` the table is not scrolled — it is re-laid out. Each row becomes a
 * card with a headline (`primary`), a subtitle (`secondary`) and labelled pairs
 * (`detail`); `hidden` columns are dropped. That is done with a second block in
 * the template rather than CSS trickery, because a real `<table>` cannot be
 * reflowed into cards without losing its semantics.
 *
 * WHY ROWS ARE NOT `role="link"`
 * ------------------------------
 * They were, and it was wrong. Putting `role="link"` on a `<tr>` overrides its
 * implicit `row` role, which removes it from the table's accessibility tree —
 * a screen-reader user loses the row/column structure that is the entire reason
 * for using a `<table>`. The fix is the boring one: a real `<a>` in the primary
 * cell. That restores the semantics, puts the destination in the browser's
 * links list, and makes middle-click and "open in new tab" work, which a click
 * handler never does. The row stays clickable for the mouse, on top of that.
 *
 * SORTING IS PAGE-LOCAL, AND SAYS SO
 * ----------------------------------
 * The backend exposes no sort parameter (see `server/README.md` §8), so sorting
 * reorders the rows currently loaded, not the whole result set. Inventing a
 * `sort=` parameter the backend ignores would look like it worked while
 * silently doing nothing — worse than not offering it. The list page shows a
 * note when a sort is active and more than one page exists.
 */
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';

import { Icon } from '../../../../../shared/components/icon/icon';
import { StatusBadge } from '../status-badge/status-badge';
import type { SortDirection, SortState, TableColumn } from './data-table.model';

@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, NgTemplateOutlet, RouterLink, StatusBadge],
  templateUrl: './data-table.html',
  host: { class: 'block' },
})
export class DataTable<T> {
  private readonly router = inject(Router);

  readonly columns = input.required<readonly TableColumn<T>[]>();
  readonly rows = input.required<readonly T[]>();
  /** Stable identity per row, for `track` and as the row's DOM id. */
  readonly rowKey = input.required<(row: T) => string>();
  /** Describes the table for screen readers, e.g. "Lista de clientes". */
  readonly caption = input.required<string>();
  /** Dims the body while the next page loads, without removing it. */
  readonly refreshing = input(false);
  /** Destination for each row. Omit for a read-only table. */
  readonly rowLink = input<((row: T) => string) | null>(null);
  /** Accessible name for the row's link, e.g. "Ver Ana Silva". */
  readonly rowLabel = input<((row: T) => string) | null>(null);

  private readonly sort = signal<SortState | null>(null);

  /** The active sort, so the page can explain that it applies to this page only. */
  readonly sortState = this.sort.asReadonly();

  protected readonly visibleColumns = computed(() =>
    this.columns().filter((column) => column.priority !== 'hidden'),
  );

  /** Columns shown in the mobile card body, in declaration order. */
  protected readonly detailColumns = computed(() =>
    this.columns().filter((column) => (column.priority ?? 'detail') === 'detail'),
  );

  protected readonly primaryColumn = computed(
    () => this.columns().find((column) => column.priority === 'primary') ?? this.columns()[0],
  );

  protected readonly secondaryColumn = computed(() =>
    this.columns().find((column) => column.priority === 'secondary'),
  );

  protected readonly sortedRows = computed(() => {
    const state = this.sort();
    const rows = this.rows();

    if (!state) {
      return rows;
    }

    const column = this.columns().find((candidate) => candidate.key === state.key);

    if (!column?.sortValue) {
      return rows;
    }

    const factor = state.direction === 'asc' ? 1 : -1;

    // Copied before sorting: the input array belongs to the store, and sorting
    // it in place would mutate state the store considers immutable.
    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);

      // Missing values sort last in *both* directions, so they are handled
      // before the direction factor is applied. Multiplying them through would
      // float every blank row to the top on the descending pass, which is
      // never what someone sorting by "Total" wants to see first.
      if (left === null || right === null) {
        return left === right ? 0 : left === null ? 1 : -1;
      }

      return factor * compare(left, right);
    });
  });

  protected toggleSort(column: TableColumn<T>): void {
    if (!column.sortValue) {
      return;
    }

    this.sort.update((current) => {
      if (current?.key !== column.key) {
        return { key: column.key, direction: 'asc' };
      }

      // Third click clears the sort and restores the backend's own order, which
      // is otherwise unreachable once a column has been clicked.
      return current.direction === 'asc' ? { key: column.key, direction: 'desc' } : null;
    });
  }

  protected sortDirectionOf(column: TableColumn<T>): SortDirection | null {
    const state = this.sort();
    return state?.key === column.key ? state.direction : null;
  }

  /** `aria-sort`, so a screen reader announces the column's state. */
  protected ariaSortOf(column: TableColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortValue) {
      return null;
    }

    const direction = this.sortDirectionOf(column);
    return direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none';
  }

  protected cellText(column: TableColumn<T>, row: T): string {
    return column.value(row) ?? '—';
  }

  protected hasValue(column: TableColumn<T>, row: T): boolean {
    return column.value(row) !== null;
  }

  protected linkFor(row: T): string | null {
    return this.rowLink()?.(row) ?? null;
  }

  protected labelFor(row: T): string | null {
    return this.rowLabel()?.(row) ?? null;
  }

  /**
   * Mouse convenience: clicking anywhere in the row follows its link.
   *
   * Clicks that already landed on a link or a button are ignored, so the
   * anchor's own navigation is not duplicated and a future row action would
   * still work.
   */
  protected onRowClick(row: T, event: Event): void {
    const target = event.target as HTMLElement | null;

    if (target?.closest('a, button')) {
      return;
    }

    const link = this.linkFor(row);

    if (link) {
      void this.router.navigateByUrl(link);
    }
  }
}

/** Orders two present values. Missing ones are handled by the caller. */
function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  // Portuguese collation, so "Ávila" files next to "Avila" rather than after Z.
  return String(a).localeCompare(String(b), 'pt', { numeric: true, sensitivity: 'base' });
}
