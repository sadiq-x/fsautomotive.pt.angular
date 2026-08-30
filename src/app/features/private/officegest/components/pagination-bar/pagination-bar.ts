import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { ApiPagination } from '../../../../../core/models';
import { Icon } from '../../../../../shared/components/icon/icon';
import { PAGE_SIZE_OPTIONS } from '../../services/resource-list.store';

/**
 * Page navigation and page size.
 *
 * WHY THIS IS NOT A NUMBERED PAGER
 * --------------------------------
 * OfficeGest does not always report a total (see `server/README.md` §8), so the
 * number of pages is sometimes unknowable. A pager that renders "1 2 3 … 47"
 * cannot degrade to that; previous/next can, and simply omits the count. The
 * component therefore reports what it actually knows — "26–50 of 130", or just
 * "Página 2" when there is no total — instead of guessing.
 *
 * `nextDisabled` is derived from the rows returned rather than from a total,
 * for the same reason: a short page is the reliable signal that it is the last.
 */
@Component({
  selector: 'app-pagination-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './pagination-bar.html',
  host: { class: 'block' },
})
export class PaginationBar {
  readonly pagination = input.required<ApiPagination>();
  /** Rows on the current page; a short page means there is no next one. */
  readonly loadedCount = input.required<number>();
  readonly disabled = input(false);

  readonly pageChange = output<number>();
  readonly perPageChange = output<number>();

  protected readonly pageSizes = PAGE_SIZE_OPTIONS;

  protected readonly page = computed(() => this.pagination().page);
  protected readonly perPage = computed(() => this.pagination().perPage);
  protected readonly total = computed(() => this.pagination().total);

  protected readonly firstIndex = computed(() =>
    this.loadedCount() === 0 ? 0 : (this.page() - 1) * this.perPage() + 1,
  );

  protected readonly lastIndex = computed(
    () => (this.page() - 1) * this.perPage() + this.loadedCount(),
  );

  /** "26–50 de 130", or "26–50" when the upstream reported no total. */
  protected readonly rangeLabel = computed(() => {
    if (this.loadedCount() === 0) {
      return 'Sem resultados';
    }

    const range = `${this.firstIndex()}–${this.lastIndex()}`;
    const total = this.total();

    return total === undefined ? range : `${range} de ${total}`;
  });

  protected readonly previousDisabled = computed(() => this.disabled() || this.page() <= 1);

  protected readonly nextDisabled = computed(() => {
    if (this.disabled()) {
      return true;
    }

    const total = this.total();

    if (total !== undefined) {
      return this.lastIndex() >= total;
    }

    // No total: a page that came back short is the last one.
    return this.loadedCount() < this.perPage();
  });

  protected onPerPage(event: Event): void {
    this.perPageChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}
