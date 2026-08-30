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

  readonly search = output<string>();

  /** First load: nothing has arrived yet, so the skeleton is the whole page. */
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
