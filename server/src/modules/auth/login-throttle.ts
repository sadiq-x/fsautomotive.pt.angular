/**
 * Rate limiting for sign-in attempts.
 *
 * WHY THE GENERAL RATE LIMITER IS NOT ENOUGH
 * ------------------------------------------
 * `rate-limit.middleware.ts` protects the upstream OfficeGest quota, so it is
 * tuned for ordinary browsing: 120 requests a minute. That is 120 password
 * guesses a minute, which against a six-character password is a weekend's work.
 * Sign-in needs a limit measured in attempts per *account*, not requests per
 * client, and it needs to survive an attacker rotating addresses.
 *
 * TWO COUNTERS, FOR TWO DIFFERENT ATTACKS
 * ---------------------------------------
 * - Per account: many guesses against one address — the classic brute force.
 * - Per client address: a few guesses against many addresses — password
 *   spraying, which the per-account counter never sees because no single
 *   account is attacked more than twice.
 *
 * WHY A SUCCESSFUL SIGN-IN CLEARS THE COUNT
 * -----------------------------------------
 * Otherwise a person who mistypes their password four times over a morning is
 * locked out by the fifth, correct, attempt hours later. The counter exists to
 * stop guessing, and someone who just proved they know the password is not
 * guessing.
 *
 * WHY LOCKING IS SCOPED, NOT GLOBAL
 * ---------------------------------
 * The account key includes the client address, so an attacker cannot lock a
 * real user out of their own account by failing five times from somewhere else.
 * Denial of service against a named colleague is the standard cost of a global
 * account lock, and it is not worth paying here.
 */

export interface LoginThrottleOptions {
  /** Failures within the window before the key is locked. */
  readonly maxAttempts: number;
  /** How long failures are remembered. */
  readonly windowMs: number;
  /** How long a locked key stays locked. */
  readonly lockMs: number;
  /**
   * Multiplier applied to `maxAttempts` for the per-address counter. A shared
   * office address legitimately produces several people's typos, so the spray
   * threshold has to sit well above one person's.
   */
  readonly addressMultiplier?: number;
  /** Overridable so tests can advance time without waiting. */
  readonly now?: () => number;
}

interface Attempts {
  failures: number;
  /** Epoch ms the current counting window opened. */
  windowStartedAt: number;
  /** Epoch ms until which the key is refused outright. `0` when not locked. */
  lockedUntil: number;
}

const DEFAULT_ADDRESS_MULTIPLIER = 5;

export class LoginThrottle {
  private readonly attempts = new Map<string, Attempts>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly lockMs: number;
  private readonly addressMultiplier: number;
  private readonly now: () => number;
  private readonly sweeper: NodeJS.Timeout;

  constructor(options: LoginThrottleOptions) {
    this.maxAttempts = options.maxAttempts;
    this.windowMs = options.windowMs;
    this.lockMs = options.lockMs;
    this.addressMultiplier = options.addressMultiplier ?? DEFAULT_ADDRESS_MULTIPLIER;
    this.now = options.now ?? Date.now;

    // Without this, one entry per attempted address accumulates for the
    // lifetime of the process — which is a memory leak an attacker controls.
    this.sweeper = setInterval(() => this.sweep(), Math.max(this.windowMs, this.lockMs));
    this.sweeper.unref?.();
  }

  /**
   * Seconds to wait before another attempt is accepted, or `null` when the
   * attempt may proceed.
   */
  retryAfterSeconds(email: string, address: string): number | null {
    const now = this.now();

    const waits = [this.accountKey(email, address), this.addressKey(address)]
      .map((key) => this.attempts.get(key)?.lockedUntil ?? 0)
      .filter((lockedUntil) => lockedUntil > now)
      .map((lockedUntil) => Math.ceil((lockedUntil - now) / 1000));

    // The longer of the two, so the answer is never optimistic.
    return waits.length > 0 ? Math.max(...waits) : null;
  }

  recordFailure(email: string, address: string): void {
    this.count(this.accountKey(email, address), this.maxAttempts);
    this.count(this.addressKey(address), this.maxAttempts * this.addressMultiplier);
  }

  /**
   * Clears the account's count.
   *
   * The per-address count is deliberately left alone: a successful sign-in
   * proves one password, which says nothing about the dozens of other addresses
   * tried from the same place, and clearing it would hand an attacker a reset
   * button in the form of one account they already own.
   */
  recordSuccess(email: string, address: string): void {
    this.attempts.delete(this.accountKey(email, address));
  }

  dispose(): void {
    clearInterval(this.sweeper);
    this.attempts.clear();
  }

  private count(key: string, limit: number): void {
    const now = this.now();
    const existing = this.attempts.get(key);
    const entry: Attempts =
      existing && now - existing.windowStartedAt < this.windowMs
        ? existing
        : { failures: 0, windowStartedAt: now, lockedUntil: 0 };

    entry.failures += 1;

    if (entry.failures >= limit) {
      entry.lockedUntil = now + this.lockMs;
      // The window restarts with the lock, so the next failure after it expires
      // is the first of a fresh count rather than an instant re-lock.
      entry.failures = 0;
      entry.windowStartedAt = now + this.lockMs;
    }

    this.attempts.set(key, entry);
  }

  /**
   * Scoped to the address, so failures from an attacker cannot lock the real
   * user out. The e-mail is lower-cased by the caller before it reaches here.
   */
  private accountKey(email: string, address: string): string {
    return `account:${email}|${address}`;
  }

  private addressKey(address: string): string {
    return `address:${address}`;
  }

  private sweep(): void {
    const now = this.now();

    for (const [key, entry] of this.attempts) {
      const idle = now - entry.windowStartedAt >= this.windowMs;

      if (idle && entry.lockedUntil <= now) {
        this.attempts.delete(key);
      }
    }
  }
}
