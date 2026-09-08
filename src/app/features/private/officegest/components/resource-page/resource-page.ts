import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { DataTable } from '../data-table/data-table';
import type { TableColumn } from '../data-table/data-table.model';
import { PaginationBar } from '../pagination-bar/pagination-bar';
import { SearchField } from '../search-field/search-field';
import { StatePanel } from '../state-panel/state-panel';
import type { ResourceListStore } from '../../services/resource-list.store';

/**
 * The whole shape of a list page: heading, search, filters, table, states and
 * pagination.
 *
 * WHY THIS IS THE MOST IMPORTANT COMPONENT HERE
 * ---------------------------------------------
 * It is what makes each list page about twenty lines. Without it, every page
 * would repeat the same ordering of concerns — and the decisions that are easy
 * to get subtly wrong would be made four times:
 *
 * - Show the skeleton only on the *first* load. A refresh keeps the rows and
 *   dims them; replacing a populated table with a skeleton on every keystroke
 *   is what makes a search box feel broken.
 * - Distinguish "nothing matches your filters" from "there is nothing here",
 *   because only the first one has a useful action.
 * - Keep the pager mounted while loading, so the layout does not jump.
 *
 * Adding a resource means supplying columns and a store. The behaviour comes
 * with the component, which is the point.
 */
@Component({
  selector: 'app-resource-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTable, PaginationBar, SearchField, StatePanel],
  templateUrl: './resource-page.html',
  host: { class: 'block' },
})
export class ResourcePage<T, F extends object> {
  readonly store = input.required<ResourceListStore<T, F>>();
  readonly columns = input.required<readonly TableColumn<T>[]>();
  readonly rowKey = input.required<(row: T) => string>();
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  /**
   * The plural noun for the count line — "clientes", "viaturas".
   *
   * Supplied per page rather than derived from the title, because the title is
   * a heading ("Clientes") and this is part of a sentence ("1 276 clientes").
   */
  readonly countNoun = input<string>('registos');
  /**
   * Whether to show the pager and page-size control.
   *
   * `false` for a collection that arrives whole — the staff roster comes back in
   * one request with `hasMore: false`, and a pager over a single page is a
   * control that can only ever do nothing.
   */
  readonly paginated = input(true);
  /** Accessible caption for the table, e.g. "Lista de clientes". */
  readonly caption = input.required<string>();
  /** Destination for each row. Omit for a read-only list. */
  readonly rowLink = input<((row: T) => string) | null>(null);
  /** Accessible name for each row's link, e.g. "Ver Ana Silva". */
  readonly rowLabel = input<((row: T) => string) | null>(null);

  /** Omit to render no search box — right for a list the backend cannot search. */
  readonly searchLabel = input<string | null>(null);
  readonly searchPlaceholder = input('Pesquisar…');
  readonly searchValue = input('');

  /**
   * The committed search term, already a plain string.
   *
   * This shares its name with a native DOM event, which bubbles. Anything
   * projected into the `filters` slot must therefore not be an
   * `<input type="search">`: its native `search` event would reach this
   * component's own `(search)` binding as a raw Event. That is exactly the
   * defect `SearchField` was carrying — see the note there.
   */
  readonly search = output<string>();

  /** First load: nothing has arrived yet, so the skeleton is the whole page. */
  /**
   * What is actually known about the size of the list.
   *
   * Three honest states, because OfficeGest reports no total:
   *   - counted        → "1–10 de 1 276 clientes"
   *   - counted, capped→ "1–10 de mais de 5 000 clientes" (the sweep hit its cap)
   *   - not counted    → "1–10 clientes", beside the action that counts them
   *
   * A guessed or omitted total would be worse than either: the page would imply
   * a size it has no way of knowing.
   */
  protected readonly countLabel = computed(() => {
    const store = this.store();

    if (store.status() === 'loading' && store.items().length === 0) {
      return 'A carregar…';
    }

    if (store.status() === 'error') {
      return '';
    }

    const loaded = store.items().length;

    if (loaded === 0) {
      return `0 ${this.countNoun()}`;
    }

    const pagination = store.pagination();
    const { page, perPage } = pagination;
    const first = (page - 1) * perPage + 1;
    const range = `${first}–${first + loaded - 1}`;

    // Some endpoints now report an exact total of their own — the bookings list
    // knows one because the backend holds the whole date window. When that is
    // present it is authoritative, and the "count" action below is redundant.
    if (pagination.total !== undefined) {
      return `${range} de ${pagination.total.toLocaleString('pt-PT')} ${this.countNoun()}`;
    }

    if (store.countStatus() === 'counting') {
      return `${range} ${this.countNoun()} — a contar o total…`;
    }

    const count = store.count();

    if (count) {
      const total = count.total.toLocaleString('pt-PT');
      return count.exact
        ? `${range} de ${total} ${this.countNoun()}`
        : `${range} de mais de ${total} ${this.countNoun()}`;
    }

    return `${range} ${this.countNoun()}`;
  });

  protected readonly showSkeleton = computed(
    () => this.store().status() === 'loading' && this.store().items().length === 0,
  );

  protected readonly showError = computed(() => this.store().status() === 'error');
  protected readonly showEmpty = computed(() => this.store().isEmpty());
  protected readonly showTable = computed(
    () => !this.showSkeleton() && !this.showError() && !this.showEmpty(),
  );

  protected readonly emptyTitle = computed(() =>
    this.store().isFiltered() ? 'Sem resultados' : 'Ainda não há registos',
  );

  protected readonly emptyMessage = computed(() =>
    this.store().isFiltered()
      ? 'Tente alterar a pesquisa ou os filtros aplicados.'
      : 'Assim que existirem dados no OfficeGest, aparecem aqui.',
  );
}
