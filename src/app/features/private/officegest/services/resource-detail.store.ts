/**
 * The single-record counterpart to `createResourceList`.
 *
 * Four detail pages need the same three states and the same retry. The
 * interesting case is the one a list does not have: a 404 is not a failure to
 * report, it is a *result* — "this record does not exist" — and it deserves its
 * own state so the page can say so plainly instead of showing an error panel
 * with a technical message.
 */
import { Injector, type Signal, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap, type Observable } from 'rxjs';

import { ApiError } from '../../../../core/models/api.model';

export type DetailStatus = 'loading' | 'ready' | 'missing' | 'error';

export interface ResourceDetailStore<T> {
  readonly data: Signal<T | null>;
  readonly status: Signal<DetailStatus>;
  readonly error: Signal<ApiError | null>;
  reload(): void;
}

export interface ResourceDetailOptions<T> {
  /** The record's identifier. A signal, so route-parameter changes refetch. */
  readonly id: Signal<string>;
  readonly fetch: (id: string) => Observable<T>;
  readonly injector?: Injector;
}

interface DetailView<T> {
  readonly status: DetailStatus;
  readonly data: T | null;
  readonly error: ApiError | null;
}

export function createResourceDetail<T>(options: ResourceDetailOptions<T>): ResourceDetailStore<T> {
  const injector = options.injector ?? inject(Injector);
  const tick = signal(0);

  const query = computed(() => ({ id: options.id(), tick: tick() }));

  const initial: DetailView<T> = { status: 'loading', data: null, error: null };

  const view = toSignal(
    toObservable(query, { injector }).pipe(
      switchMap((current) =>
        options.fetch(current.id).pipe(
          map((data): DetailView<T> => ({ status: 'ready', data, error: null })),
          catchError((error: unknown) => {
            const apiError =
              error instanceof ApiError
                ? error
                : new ApiError(0, 'UNKNOWN', 'Não foi possível carregar o registo.');

            return of<DetailView<T>>({
              // A 404 is an answer, not a fault: the page shows "não
              // encontrado" rather than an error panel offering a retry that
              // cannot possibly help.
              status: apiError.status === 404 ? 'missing' : 'error',
              data: null,
              error: apiError,
            });
          }),
          startWith<DetailView<T>>(initial),
        ),
      ),
    ),
    { initialValue: initial, injector },
  );

  return {
    data: computed(() => view().data),
    status: computed(() => view().status),
    error: computed(() => view().error),
    reload: () => tick.update((value) => value + 1),
  };
}
