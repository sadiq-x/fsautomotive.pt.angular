/**
 * Server-side sessions, keyed by an unguessable id the browser holds in a
 * cookie.
 *
 * WHY A STORE AND NOT A SELF-CONTAINED TOKEN
 * ------------------------------------------
 * A signed JWT in the cookie would need no store — and could not be revoked.
 * "Sign out" would clear the cookie on one device and leave a token that stays
 * valid everywhere else until it expires; disabling an account would take
 * effect at the next expiry rather than at once. A server-side record makes
 * revocation immediate, which is the property a workshop with shared terminals
 * actually needs. The cost is that sessions live in this process — see the
 * limits below.
 *
 * WHY THE COOKIE IS SIGNED AS WELL
 * --------------------------------
 * The id is 256 bits of randomness, so guessing one is not a threat worth
 * modelling. The HMAC buys something else: a forged or truncated cookie is
 * rejected by a constant-time comparison *before* it reaches the map, so the
 * store cannot be probed at all, and a cookie minted by an instance with a
 * different secret is never mistaken for one of ours.
 *
 * TWO CLOCKS, DELIBERATELY
 * ------------------------
 * An *idle* timeout ends a session left open on an unattended terminal. An
 * *absolute* timeout bounds how long a stolen cookie is worth stealing, which
 * an idle timeout alone never does — a session kept warm by activity would
 * otherwise last for ever.
 *
 * LIMITS OF THIS IMPLEMENTATION
 * -----------------------------
 * The records live in this process, so a restart signs everyone out and a
 * second instance behind a load balancer does not see the first one's sessions.
 * That is an accepted trade for a single-instance deployment, and it is the
 * same trade `rate-limit.middleware.ts` already documents. Moving to a shared
 * store is a change to this file and to nothing else — which is why the rest of
 * the application never sees a session id.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** What a valid cookie resolves to. Never leaves the auth module. */
export interface SessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: number;
  /** Epoch ms. Not extended by activity. */
  readonly absoluteExpiresAt: number;
  /** Epoch ms. Pushed forward on every authenticated request. */
  idleExpiresAt: number;
}

export interface SessionStoreOptions {
  /** Signs the cookie. At least 32 characters; validated by `env.ts`. */
  readonly secret: string;
  /** Longest a session may live, however active. */
  readonly absoluteTtlMs: number;
  /** Longest a session may sit unused. */
  readonly idleTtlMs: number;
  /** Overridable so tests can advance time without waiting. */
  readonly now?: () => number;
}

export interface IssuedSession {
  /** The cookie value. */
  readonly token: string;
  /** Cookie lifetime in seconds — the shorter of the two clocks. */
  readonly maxAgeSeconds: number;
}

/** Separates the id from its signature. Not valid base64url, so unambiguous. */
const TOKEN_SEPARATOR = '.';

const ID_BYTES = 32;

export class SessionStore {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly secret: string;
  private readonly absoluteTtlMs: number;
  private readonly idleTtlMs: number;
  private readonly now: () => number;
  private readonly sweeper: NodeJS.Timeout;

  constructor(options: SessionStoreOptions) {
    this.secret = options.secret;
    this.absoluteTtlMs = options.absoluteTtlMs;
    this.idleTtlMs = options.idleTtlMs;
    this.now = options.now ?? Date.now;

    // Expired records are dropped on read, but only for sessions somebody comes
    // back to. Without this sweep, a session abandoned at sign-in time would be
    // held for the lifetime of the process. `unref` keeps the timer from
    // holding Node open at shutdown.
    this.sweeper = setInterval(() => this.sweep(), Math.max(this.idleTtlMs, 60_000));
    this.sweeper.unref?.();
  }

  /** Starts a session. Called only after credentials have been verified. */
  create(userId: string): IssuedSession {
    const now = this.now();
    const id = randomBytes(ID_BYTES).toString('base64url');

    const record: SessionRecord = {
      id,
      userId,
      createdAt: now,
      absoluteExpiresAt: now + this.absoluteTtlMs,
      idleExpiresAt: now + this.idleTtlMs,
    };

    this.sessions.set(id, record);

    return {
      token: `${id}${TOKEN_SEPARATOR}${this.sign(id)}`,
      // The cookie should not outlive the session it names. The browser
      // discarding it at the same moment saves a pointless round trip that can
      // only ever be answered with a 401.
      maxAgeSeconds: Math.floor(Math.min(this.absoluteTtlMs, this.idleTtlMs) / 1000),
    };
  }

  /**
   * Resolves a cookie to its session, sliding the idle window.
   *
   * Returns `null` for anything that is not a live session — malformed,
   * unsigned, unknown or expired — because the caller's answer is the same in
   * every case, and a more descriptive return value would only invite a log
   * line that tells an attacker which of their guesses was closest.
   */
  verify(token: string | undefined): SessionRecord | null {
    const id = this.unsign(token);

    if (id === null) {
      return null;
    }

    const record = this.sessions.get(id);

    if (!record) {
      return null;
    }

    const now = this.now();

    if (now >= record.absoluteExpiresAt || now >= record.idleExpiresAt) {
      this.sessions.delete(id);
      return null;
    }

    // Sliding, but never past the absolute deadline: activity may not extend a
    // session beyond the lifetime it was issued with.
    record.idleExpiresAt = Math.min(now + this.idleTtlMs, record.absoluteExpiresAt);

    return record;
  }

  /** Ends one session. Signing out on one device leaves the others alone. */
  destroy(token: string | undefined): void {
    const id = this.unsign(token);

    if (id !== null) {
      this.sessions.delete(id);
    }
  }

  /** Live session count. For tests and diagnostics only. */
  get size(): number {
    return this.sessions.size;
  }

  /** Stops the sweeper so the process can exit. */
  dispose(): void {
    clearInterval(this.sweeper);
    this.sessions.clear();
  }

  private sign(id: string): string {
    return createHmac('sha256', this.secret).update(id).digest('base64url');
  }

  /** The id when the signature is ours, `null` otherwise. */
  private unsign(token: string | undefined): string | null {
    if (!token) {
      return null;
    }

    const separator = token.indexOf(TOKEN_SEPARATOR);

    if (separator < 1 || separator === token.length - 1) {
      return null;
    }

    const id = token.slice(0, separator);
    const signature = Buffer.from(token.slice(separator + 1), 'base64url');
    const expected = Buffer.from(this.sign(id), 'base64url');

    // A truncated signature would make `timingSafeEqual` throw, so the length
    // is checked first — a length mismatch is already a rejection, and leaks
    // nothing the attacker did not supply.
    if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
      return null;
    }

    return id;
  }

  private sweep(): void {
    const now = this.now();

    for (const [id, record] of this.sessions) {
      if (now >= record.absoluteExpiresAt || now >= record.idleExpiresAt) {
        this.sessions.delete(id);
      }
    }
  }
}
