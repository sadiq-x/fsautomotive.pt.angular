/**
 * Sign-in, session resolution and sign-out.
 *
 * This is the security boundary the Angular application's route guards are
 * explicitly *not*. Everything the browser does — hiding a link, redirecting to
 * `/private/login` — is presentation; the decisions that matter are the three
 * methods below and `requirePermission` in `access.middleware.ts`.
 *
 * WHY EVERY FAILURE LOOKS THE SAME
 * --------------------------------
 * An unknown address, a wrong password and a disabled account all produce one
 * 401 with one code and one message. Distinguishing them would turn the login
 * form into a directory of who works here, which is the first thing an attacker
 * wants and the last thing a sign-in form should provide. The *log* records
 * which of the three it was, because that distinction is exactly what an
 * administrator needs and the log is not attacker-readable.
 *
 * The same reasoning covers timing: a password is verified even when the
 * address is unknown, so the response takes as long either way. Without it, a
 * 5 ms answer would mean "no such account" and a 100 ms answer "wrong
 * password", and the enumeration defence above would be decorative.
 */
import { AppError, ERROR_CODES, InvalidCredentialsError } from '../../shared/errors/index.js';
import type { Logger } from '../../shared/logger.js';
import type { AuthConfig } from '../../config/auth.config.js';
import { toSessionUser, type AuthUser, type SessionUser } from './auth.model.js';
import { verifyPassword } from './password.js';
import { SessionStore, type IssuedSession } from './session.store.js';
import { LoginThrottle } from './login-throttle.js';

export interface LoginAttempt {
  readonly email: string;
  readonly password: string;
  /** The client address, for the throttle. `req.ip`, honouring `trust proxy`. */
  readonly address: string;
  readonly logger: Logger;
}

export interface LoginResult {
  readonly user: SessionUser;
  readonly session: IssuedSession;
}

/** One message for every way a sign-in can fail. See the note above. */
const REFUSED = 'E-mail ou palavra-passe incorretos.';

export class AuthService {
  readonly enabled: boolean;

  private readonly byEmail: ReadonlyMap<string, AuthUser>;
  private readonly byId: ReadonlyMap<string, AuthUser>;
  private readonly sessions: SessionStore | null;
  private readonly throttle: LoginThrottle | null;
  /**
   * A real hash, verified against when no account matches, purely to spend the
   * same CPU as a genuine check.
   *
   * It is one of the configured hashes rather than a fabricated one so the cost
   * parameters cannot drift apart from the accounts they are meant to imitate —
   * a decoy hashed at a lower cost would leak the very timing difference it
   * exists to hide. The comparison's result is discarded.
   */
  private readonly decoyHash: string | null;

  constructor(config: AuthConfig, now?: () => number) {
    this.enabled = config.enabled;

    const byEmail = new Map<string, AuthUser>();
    const byId = new Map<string, AuthUser>();

    for (const user of config.users) {
      byEmail.set(user.email, user);
      byId.set(user.id, user);
    }

    this.byEmail = byEmail;
    this.byId = byId;
    this.decoyHash = config.users.at(0)?.passwordHash ?? null;

    this.sessions = config.enabled
      ? new SessionStore({
          secret: config.sessionSecret,
          absoluteTtlMs: config.session.absoluteTtlMs,
          idleTtlMs: config.session.idleTtlMs,
          now,
        })
      : null;

    this.throttle = config.enabled
      ? new LoginThrottle({
          maxAttempts: config.login.maxAttempts,
          windowMs: config.login.windowMs,
          lockMs: config.login.lockMs,
          now,
        })
      : null;
  }

  /**
   * Verifies credentials and starts a session.
   *
   * @throws {AppError} 401 for any refusal, 429 once the attempt limit is hit.
   */
  async login(attempt: LoginAttempt): Promise<LoginResult> {
    if (!this.sessions || !this.throttle) {
      // Unreachable: the routes are not mounted when sign-in is off. Kept
      // because the alternative to an explicit failure here is a crash whose
      // message would be `Cannot read properties of null`.
      throw new AppError(501, ERROR_CODES.INTERNAL_ERROR, 'Sign-in is not configured.');
    }

    const email = attempt.email.trim().toLowerCase();
    const retryAfterSeconds = this.throttle.retryAfterSeconds(email, attempt.address);

    if (retryAfterSeconds !== null) {
      attempt.logger.warn('sign-in refused: too many attempts', { email, retryAfterSeconds });

      throw new AppError(
        429,
        ERROR_CODES.ACCOUNT_LOCKED,
        'Demasiadas tentativas. Aguarde alguns minutos antes de tentar novamente.',
        { retryAfterSeconds },
      );
    }

    const user = this.byEmail.get(email);
    // The decoy keeps the cost identical for an address that does not exist.
    const hash = user?.passwordHash ?? this.decoyHash;
    const passwordMatches = hash !== null && (await verifyPassword(attempt.password, hash));

    if (!user || user.disabled || !passwordMatches) {
      this.throttle.recordFailure(email, attempt.address);

      // The only place the three cases are distinguished — and it is a log
      // line, which the person guessing passwords cannot read.
      attempt.logger.warn('sign-in refused', {
        email,
        reason: !user ? 'unknown-account' : user.disabled ? 'account-disabled' : 'wrong-password',
      });

      throw new InvalidCredentialsError(REFUSED);
    }

    this.throttle.recordSuccess(email, attempt.address);

    // The session is created only now, so there is no session id in existence
    // before the password was verified — which is what makes session fixation
    // impossible rather than merely unlikely.
    const session = this.sessions.create(user.id);

    attempt.logger.info('signed in', { userId: user.id, role: user.role });

    return { user: toSessionUser(user), session };
  }

  /**
   * Resolves a session cookie to its user, or `null`.
   *
   * The account is re-read on every request rather than copied into the
   * session, so disabling one takes effect immediately for sessions already
   * open — a session that outlives its account is how a dismissed employee
   * keeps their access until the next restart.
   */
  resolve(token: string | undefined): SessionUser | null {
    const record = this.sessions?.verify(token);

    if (!record) {
      return null;
    }

    const user = this.byId.get(record.userId);

    if (!user || user.disabled) {
      this.sessions?.destroy(token);
      return null;
    }

    return toSessionUser(user);
  }

  /** Ends the session named by the cookie. Unknown tokens are a no-op. */
  logout(token: string | undefined): void {
    this.sessions?.destroy(token);
  }

  /** Live sessions. For the health endpoint and tests. */
  get activeSessions(): number {
    return this.sessions?.size ?? 0;
  }

  dispose(): void {
    this.sessions?.dispose();
    this.throttle?.dispose();
  }
}
