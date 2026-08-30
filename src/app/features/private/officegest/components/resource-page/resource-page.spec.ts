/**
 * The list scaffold, rendered against a real HTTP backend double.
 *
 * These assertions are about what the user sees in each state — which is the
 * part that would silently regress. In particular: a refresh must not replace
 * the table with a skeleton, because that is what makes a search box feel like
 * it is breaking the page on every keystroke.
 */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { Customer } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceList } from '../../services/resource-list.store';
import type { TableColumn } from '../data-table/data-table.model';
import { ResourcePage } from './resource-page';

const COLUMNS: readonly TableColumn<Customer>[] = [
  {
    key: 'name',
    header: 'Nome',
    value: (row) => row.name,
    sortValue: (row) => row.name,
    priority: 'primary',
  },
  { key: 'city', header: 'Localidade', value: (row) => row.city ?? null },
];

@Component({
  imports: [ResourcePage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-resource-page
      title="Clientes"
      caption="Lista de clientes"
      searchLabel="Pesquisar"
      [store]="store"
      [columns]="columns"
      [rowKey]="rowKey"
      (search)="store.setFilters({ search: $event || undefined })"
    />
  `,
})
class Host {
  private readonly officegest = TestBed.inject(OfficeGestService);

  readonly columns = COLUMNS;
  readonly rowKey = (row: Customer): string => row.id;
  readonly store = createResourceList<Customer, { search?: string }>({
    fetch: (query) => this.officegest.listCustomers(query),
    initialFilters: {},
  });
}

describe('ResourcePage', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    backend = TestBed.inject(HttpTestingController);
  });

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture;
  }

  function respond(customers: readonly Customer[], total = customers.length): void {
    backend
      .expectOne((request) => request.url.endsWith('/api/officegest/customers'))
      .flush({ success: true, data: customers, meta: { page: 1, perPage: 25, total } });
  }

  it('shows a skeleton while the first page loads', () => {
    const fixture = render();

    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).toBeTruthy();

    respond([]);
  });

  it('renders the rows once they arrive', async () => {
    const fixture = render();

    respond([
      { id: '1', name: 'Ana Silva', city: 'Vialonga' },
      { id: '2', name: 'Bruno Costa', city: 'Loures' },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ana Silva');
    expect(text).toContain('Bruno Costa');
    expect(fixture.nativeElement.querySelector('table')).toBeTruthy();
  });

  it('shows an empty state, and suggests nothing to clear when nothing is filtered', async () => {
    const fixture = render();

    respond([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ainda não há registos');
  });

  it('suggests changing the filters when a search returned nothing', async () => {
    const fixture = render();

    respond([{ id: '1', name: 'Ana' }]);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.store.setFilters({ search: 'zzz' });
    await fixture.whenStable();
    fixture.detectChanges();

    respond([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sem resultados');
    expect(fixture.nativeElement.textContent).toContain('Tente alterar a pesquisa');
  });

  it('shows an error state with a retry when the request fails', async () => {
    const fixture = render();

    backend
      .expectOne((request) => request.url.endsWith('/api/officegest/customers'))
      .flush(
        { success: false, error: { code: 'OFFICEGEST_UNAVAILABLE', message: 'x' }, requestId: 'r' },
        { status: 502, statusText: 'Bad Gateway' },
      );

    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Não foi possível carregar os dados');
    expect(text).toContain('Tentar novamente');
  });

  // Replacing a populated table with a skeleton on every keystroke is what
  // makes a search box feel like it is breaking the page.
  it('keeps the rows on screen while the next page loads', async () => {
    const fixture = render();

    respond([{ id: '1', name: 'Ana Silva' }]);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.store.setPage(2);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ana Silva');
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).toBeFalsy();

    respond([{ id: '2', name: 'Bruno Costa' }]);
  });

  it('returns to the first page when a filter changes', async () => {
    const fixture = render();

    respond([{ id: '1', name: 'Ana' }]);
    await fixture.whenStable();

    fixture.componentInstance.store.setPage(3);
    await fixture.whenStable();
    respond([{ id: '2', name: 'Bruno' }]);
    await fixture.whenStable();

    fixture.componentInstance.store.setFilters({ search: 'ana' });
    await fixture.whenStable();

    const request = backend.expectOne((candidate) =>
      candidate.url.endsWith('/api/officegest/customers'),
    );
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ success: true, data: [], meta: { page: 1, perPage: 25, total: 0 } });
  });
});
