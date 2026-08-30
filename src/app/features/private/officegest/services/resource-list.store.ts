/**
 * The list behaviour every OfficeGest table needs, written once.
 *
 * WHY THIS EXISTS
 * ---------------
 * Four list pages need the same six things: current page, page size, filters,
 * a request that refires when any of those change, cancellation of the request
 * that is now obsolete, and a status the template can branch on. Implemented
 * per page, that is four chances to forget the cancellation — which is how a
 * slow first page arrives *after* the second and overwrites it.
 *
 * `switchMap` is the whole trick: a new query unsubscribes from the in-flight
 * request, so the last query issued is always the one rendered.
 *
 * WHY THE STATE IS REDUCED WITH `scan`
 * ------------------------------------
 * While page 2 loads, page 1 should stay on screen, dimmed — collapsing to a
 * spinner and back reads as the page breaking. That means the new state depends
 * on the previous one, which a `computed` cannot express: writing to a signal
 * inside one is forbidden. A reducer over the stream is the honest shape for
 * "carry the last good page forward", and it stays pure.
 *
 * WHY NOT A STATE LIBRARY
 * -----------------------
 * There is no shared state here. Each page owns its own list, nothing else
 * reads it, and it dies with the component. A global store would give this
 * per-component state a global lifetime and a reason to leak between pages.
 *
 * WHY IT IS NOT DEBOUNCED
 * -----------------------
 * Debouncing belongs to the control that produces the keystrokes, not to the
 * thing that fetches — see `SearchField`, which emits at most once per pause.
 * Putting it here would also delay page changes and filter clicks, which should
 * be immediate.
 */
import { Injector, type Signal, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, scan, startWith, switchMap, type Observable } from 'rxjs';

import { ApiError, type ApiPagination, type Paged } from '../../../../core/models/api.model';

export type ListStatus = 'loading' | 'ready' | 'error';

/** The pagination the private area starts every list on. */
export const DEFAULT_PER_PAGE = 25;

/** Offered in the page-size control. The backend rejects anything above 100. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/** What the fetcher receives: the page, the size, and the page's own filters. */
export type ListQueryOf<F> = F & { readonly page: number; readonly perPage: number };

export interface ResourceListStore<T, F extends object> {
  /** The last successfully loaded page. Kept while the next one loads. */
  readonly items: Signal<readonly T[]>;
  readonly pagination: Signal<ApiPagination>;
  readonly status: Signal<ListStatus>;
  readonly error: Signal<ApiError | null>;
  /** `true` only once a request has succeeded and returned nothing. */
  readonly isEmpty: Signal<boolean>;
  /** `true` when filters are narrowing the list — changes the empty message. */
  readonly isFiltered: Signal<boolean>;
  readonly filters: Signal<F>;
  readonly page: Signal<number>;
  readonly perPage: Signal<number>;
  /** `true` while refreshing a list that already has rows on screen. */
  readonly isRefreshing: Signal<boolean>;

  /** Applies a filter change and returns to page 1, where the results now are. */
  setFilters(patch: Partial<F>): void;
  setPage(page: number): void;
  setPerPage(perPage: number): void;
  reload(): void;
}

export interface ResourceListOptions<T, F extends object> {
  /** Performs one request. Called again whenever the query changes. */
  readonly fetch: (query: ListQueryOf<F>) => Observable<Paged<T>>;
  readonly initialFilters: F;
  readonly perPage?: number;
  /** Decides whether the empty state should suggest clearing filters. */
  readonly hasActiveFilters?: (filters: F) => boolean;
  /** Required only outside an injection context, such as in a test. */
  readonly injector?: Injector;
}

/** What one request attempt reports back to the reducer. */
type ListEvent<T> =
  | { readonly kind: 'loading' }
  | { readonly kind: 'loaded'; readonly page: Paged<T> }
  | { readonly kind: 'failed'; readonly error: ApiError };

/** The rendered state of the list. */
interface ListView<T> {
  readonly status: ListStatus;
  readonly items: readonly T[];
  readonly pagination: ApiPagination | null;
  readonly error: ApiError | null;
}

/** Any filter with a value counts as active, which suits every current page. */
function defaultHasActiveFilters<F extends object>(filters: F): boolean {
  return Object.values(filters).some(
    (value) => value !== undefined && value !== null && value !== '',
  );
}

/**
 * Folds one request event onto the previous view.
 *
 * The only interesting rule: `loading` keeps the rows and pagination that are
 * already on screen. A failure clears them, because showing stale rows beside
 * an error message invites the user to trust data that may no longer be true.
 */
function reduce<T>(previous: ListView<T>, event: ListEvent<T>): ListView<T> {
  switch (event.kind) {
    case 'loading':
      return { ...previous, status: 'loading', error: null };
    case 'loaded':
      return {
        status: 'ready',
        items: event.page.items,
        pagination: event.page.pagination,
        error: null,
      };
    case 'failed':
      return { status: 'error', items: [], pagination: previous.pagination, error: event.error };
  }
}

export function createResourceList<T, F extends object>(
  options: ResourceListOptions<T, F>,
): ResourceListStore<T, F> {
  const injector = options.injector ?? inject(Injector);

  const filters = signal<F>(options.initialFilters);
  const page = signal(1);
  const perPage = signal(options.perPage ?? DEFAULT_PER_PAGE);
  /** Bumped by `reload()`; part of the query so a repeat refires the request. */
  const tick = signal(0);

  const query = computed(() => ({
    filters: filters(),
    page: page(),
    perPage: perPage(),
    // Read so the computed depends on it. Never sent to the backend.
    tick: tick(),
  }));

  const initialView: ListView<T> = {
    status: 'loading',
    items: [],
    pagination: null,
    error: null,
  };

  const view = toSignal(
    toObservable(query, { injector }).pipe(
      switchMap((current) =>
        options
          .fetch({
            ...current.filters,
            page: current.page,
            perPage: current.perPage,
          } as ListQueryOf<F>)
          .pipe(
            map((loaded): ListEvent<T> => ({ kind: 'loaded', page: loaded })),
            catchError((error: unknown) =>
              of<ListEvent<T>>({
                kind: 'failed',
                error:
                  error instanceof ApiError
                    ? error
                    : new ApiError(0, 'UNKNOWN', 'Não foi possível carregar os dados.'),
              }),
            ),
            startWith<ListEvent<T>>({ kind: 'loading' }),
          ),
      ),
      // Outside `switchMap`, so the fold accumulates across queries rather than
      // restarting with each one.
      scan(reduce<T>, initialView),
    ),
    { initialValue: initialView, injector },
  );

  const items = computed(() => view().items);
  const status = computed(() => view().status);
  const hasActiveFilters = options.hasActiveFilters ?? defaultHasActiveFilters;

  return {
    items,
    status,
    pagination: computed(() => view().pagination ?? { page: page(), perPage: perPage() }),
    error: computed(() => view().error),
    isEmpty: computed(() => status() === 'ready' && items().length === 0),
    isFiltered: computed(() => hasActiveFilters(filters())),
    filters: filters.asReadonly(),
    page: page.asReadonly(),
    perPage: perPage.asReadonly(),
    isRefreshing: computed(() => status() === 'loading' && items().length > 0),

    setFilters(patch: Partial<F>): void {
      filters.update((current) => ({ ...current, ...patch }));
      // Page 4 of the old result set is rarely page 4 of the new one, and an
      // out-of-range page returns nothing, which looks like "no results".
      page.set(1);
    },

    setPage(next: number): void {
      page.set(Math.max(1, next));
    },

    setPerPage(next: number): void {
      perPage.set(next);
      page.set(1);
    },

    reload(): void {
      tick.update((value) => value + 1);
    },
  };
}
