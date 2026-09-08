/**
 * One in-flight fetch, one cached answer, for a bounded time.
 *
 * WHY THIS EXISTS
 * ---------------
 * Two things in this service are expensive to fetch and effectively static:
 * the workshop's reference tables, and the size of a collection the upstream
 * refuses to count (see `officegest.counter.ts`). Both need the same three
 * behaviours, and each of them is easy to get subtly wrong on its own:
 *
 *  - serve a cached value until it expires;
 *  - let callers that arrive together share ONE fetch, rather than starting a
 *    sweep each;
 *  - never cache a failure, so a transient upstream error does not persist for
 *    the whole TTL.
 *
 * WHY A REJECTION IS NOT SWALLOWED HERE
 * -------------------------------------
 * This utility has no opinion about what an absent value means — a missing
 * fuel name is cosmetic, a missing count is a tile that must say so. The
 * rejection propagates and each caller decides. What this guarantees is only
 * that the failure is not remembered.
 *
 * WHY THE LOADER TAKES NO ARGUMENTS
 * ---------------------------------
 * Because the result is shared. A loader bound to one caller's `AbortSignal`
 * would let a browser navigating away cancel the fetch that three other
 * requests are waiting on, and a loader keyed on one caller's arguments would
 * serve their answer to everybody. Anything that varies per caller belongs
 * outside the memo.
 */

export interface TtlMemo<T> {
  /** The cached value, the fetch already running, or a new one. */
  get(): Promise<T>;
  /** Drops what is held, so the next `get` fetches again. */
  clear(): void;
}

export function memoizeWithTtl<T>(
  load: () => Promise<T>,
  ttlMs: number,
  now: () => number = Date.now,
): TtlMemo<T> {
  let cached: { value: T; expiresAt: number } | null = null;
  let inFlight: Promise<T> | null = null;

  return {
    async get(): Promise<T> {
      if (cached && cached.expiresAt > now()) {
        return cached.value;
      }

      inFlight ??= load()
        .then((value) => {
          cached = { value, expiresAt: now() + ttlMs };
          return value;
        })
        .finally(() => {
          inFlight = null;
        });

      return inFlight;
    },

    clear(): void {
      cached = null;
    },
  };
}
