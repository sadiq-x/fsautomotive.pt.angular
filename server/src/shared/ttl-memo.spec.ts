/**
 * The shared cache behind the reference tables and the collection counts.
 *
 * Three of these describe behaviour that only shows up under concurrency or
 * failure — exactly the cases a hand-rolled cache tends to get wrong, and the
 * reason this is one utility rather than one per call site.
 */
import { describe, expect, it, vi } from 'vitest';

import { memoizeWithTtl } from './ttl-memo.js';

describe('memoizeWithTtl', () => {
  it('loads once and serves the cached value until it expires', async () => {
    const load = vi.fn().mockResolvedValue('value');
    let now = 0;
    const memo = memoizeWithTtl(load, 1000, () => now);

    expect(await memo.get()).toBe('value');
    now = 999;
    expect(await memo.get()).toBe('value');

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('loads again once the entry has expired', async () => {
    const load = vi.fn().mockResolvedValue('value');
    let now = 0;
    const memo = memoizeWithTtl(load, 1000, () => now);

    await memo.get();
    now = 1001;
    await memo.get();

    expect(load).toHaveBeenCalledTimes(2);
  });

  /** Ten dashboards opening at once must not start ten collection sweeps. */
  it('collapses callers that arrive together onto one load', async () => {
    let release: (value: string) => void = () => undefined;
    const load = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        }),
    );
    const memo = memoizeWithTtl(load, 1000);

    const waiting = Promise.all(Array.from({ length: 10 }, () => memo.get()));
    release('value');

    expect(await waiting).toEqual(Array.from({ length: 10 }, () => 'value'));
    expect(load).toHaveBeenCalledTimes(1);
  });

  /**
   * A transient upstream failure must not become a six-hour outage, which is
   * what caching the rejection would make it.
   */
  it('does not cache a failure', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('upstream')).mockResolvedValue('value');
    const memo = memoizeWithTtl(load, 1000);

    await expect(memo.get()).rejects.toThrow('upstream');
    expect(await memo.get()).toBe('value');
  });

  /** A rejection must also release the in-flight slot, not wedge it forever. */
  it('recovers after every waiter on a failed load has rejected', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('upstream')).mockResolvedValue('value');
    const memo = memoizeWithTtl(load, 1000);

    const results = await Promise.allSettled([memo.get(), memo.get()]);

    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(await memo.get()).toBe('value');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('forgets what it holds when cleared', async () => {
    const load = vi.fn().mockResolvedValue('value');
    const memo = memoizeWithTtl(load, 1000);

    await memo.get();
    memo.clear();
    await memo.get();

    expect(load).toHaveBeenCalledTimes(2);
  });
});
