import { afterEach, describe, expect, it } from 'vitest';

import { SessionStore } from './session.store.js';

const SECRET = 'a-secret-long-enough-to-be-a-key-0123456789';
const MINUTE = 60_000;

/** A store whose clock the test controls, so expiry is tested without waiting. */
function storeAt(
  clock: { now: number },
  options: { absoluteTtlMs?: number; idleTtlMs?: number } = {},
) {
  return new SessionStore({
    secret: SECRET,
    absoluteTtlMs: options.absoluteTtlMs ?? 8 * 60 * MINUTE,
    idleTtlMs: options.idleTtlMs ?? 60 * MINUTE,
    now: () => clock.now,
  });
}

const stores: SessionStore[] = [];

function track(store: SessionStore): SessionStore {
  stores.push(store);
  return store;
}

afterEach(() => {
  // Each store holds an interval. Leaking one per test would keep the runner
  // alive at the end of the suite.
  stores.splice(0).forEach((store) => store.dispose());
});

describe('SessionStore', () => {
  it('resolves a token it issued to the user it was issued for', () => {
    const clock = { now: 1_000 };
    const store = track(storeAt(clock));

    const { token } = store.create('user-1');

    expect(store.verify(token)?.userId).toBe('user-1');
  });

  it.each([
    ['undefined', undefined],
    ['empty', ''],
    ['unsigned', 'just-an-id'],
    ['signed with the wrong key', 'an-id.bm90LXRoZS1zaWduYXR1cmU'],
    ['truncated', 'an-id.'],
  ])('refuses a %s token', (_label, token) => {
    const store = track(storeAt({ now: 0 }));

    expect(store.verify(token)).toBeNull();
  });

  /**
   * The signature is checked before the map is touched, so a caller cannot use
   * response timing or behaviour to learn whether an id exists.
   */
  it('refuses a valid id carrying another instance signature', () => {
    const clock = { now: 0 };
    const mine = track(storeAt(clock));
    const theirs = track(
      new SessionStore({
        secret: 'a-different-secret-of-quite-sufficient-length',
        absoluteTtlMs: MINUTE,
        idleTtlMs: MINUTE,
        now: () => clock.now,
      }),
    );

    const { token } = theirs.create('user-1');

    expect(mine.verify(token)).toBeNull();
  });

  it('forgets a session once its idle window passes', () => {
    const clock = { now: 0 };
    const store = track(storeAt(clock, { idleTtlMs: 30 * MINUTE }));

    const { token } = store.create('user-1');
    clock.now += 31 * MINUTE;

    expect(store.verify(token)).toBeNull();
    // Dropped, not merely reported as invalid — otherwise an abandoned session
    // occupies memory until the process restarts.
    expect(store.size).toBe(0);
  });

  it('extends the idle window on use, so an active session survives', () => {
    const clock = { now: 0 };
    const store = track(storeAt(clock, { idleTtlMs: 30 * MINUTE }));

    const { token } = store.create('user-1');

    for (let minute = 0; minute < 90; minute += 20) {
      clock.now += 20 * MINUTE;
      expect(store.verify(token)).not.toBeNull();
    }
  });

  /**
   * The property an idle timeout alone never gives: a session kept warm by
   * activity must still end, or a stolen cookie is worth stealing for ever.
   */
  it('ends a session at its absolute deadline however active it has been', () => {
    const clock = { now: 0 };
    const store = track(storeAt(clock, { absoluteTtlMs: 60 * MINUTE, idleTtlMs: 30 * MINUTE }));

    const { token } = store.create('user-1');

    clock.now += 25 * MINUTE;
    expect(store.verify(token)).not.toBeNull();

    clock.now += 25 * MINUTE;
    expect(store.verify(token)).not.toBeNull();

    clock.now += 25 * MINUTE;
    expect(store.verify(token)).toBeNull();
  });

  it('never extends the idle window past the absolute deadline', () => {
    const clock = { now: 0 };
    const store = track(storeAt(clock, { absoluteTtlMs: 10 * MINUTE, idleTtlMs: 60 * MINUTE }));

    const { token } = store.create('user-1');
    const record = store.verify(token);

    expect(record?.idleExpiresAt).toBe(record?.absoluteExpiresAt);
  });

  it('expires the cookie no later than the session it names', () => {
    const store = track(
      storeAt({ now: 0 }, { absoluteTtlMs: 10 * MINUTE, idleTtlMs: 60 * MINUTE }),
    );

    expect(store.create('user-1').maxAgeSeconds).toBe(600);
  });

  it('destroys one session without touching the others', () => {
    const store = track(storeAt({ now: 0 }));

    const first = store.create('user-1');
    const second = store.create('user-1');

    store.destroy(first.token);

    expect(store.verify(first.token)).toBeNull();
    expect(store.verify(second.token)?.userId).toBe('user-1');
  });

  it('issues a distinct session every time, so no id is ever reused', () => {
    const store = track(storeAt({ now: 0 }));

    const tokens = new Set([1, 2, 3, 4, 5].map(() => store.create('user-1').token));

    expect(tokens.size).toBe(5);
  });
});
