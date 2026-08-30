/**
 * The contract every OfficeGest authentication mechanism implements.
 *
 * WHY A STRATEGY AND NOT AN `if`
 * ------------------------------
 * OfficeGest documents two mechanisms — HTTP Basic on v1, and a Bearer token
 * obtained from `POST /auth/login` on v2 — and they behave differently in a way
 * the transport cannot ignore: one is a pure function of the credential, the
 * other holds state that expires mid-flight. Branching inside the client would
 * put token-refresh logic in the middle of the retry loop. Behind this
 * interface, the client only ever knows "ask for headers; on a 401, tell the
 * strategy and ask again".
 *
 * It is also what makes the credential shape a configuration decision instead
 * of a rewrite: adding a mechanism is a new file and one line in the factory.
 */

/**
 * Performs an unauthenticated request against OfficeGest.
 *
 * Injected by the client so a strategy can log in without importing the client
 * — which would be circular — and without opening its own HTTP path that would
 * miss the shared timeout, logging and error mapping.
 */
export type UnauthenticatedRequest = (options: {
  readonly path: string;
  readonly method: 'POST' | 'DELETE';
  readonly body?: unknown;
  readonly signal?: AbortSignal;
}) => Promise<unknown>;

export interface OfficeGestAuthStrategy {
  /** Matches the configured `OFFICEGEST_AUTH_MODE`; used in log lines. */
  readonly mode: string;

  /**
   * Headers to merge into an outgoing request. Called on every attempt, so an
   * expired token is refreshed transparently.
   */
  getAuthHeaders(signal?: AbortSignal): Promise<Readonly<Record<string, string>>>;

  /**
   * Called when OfficeGest answered 401. The strategy drops any cached
   * credential state.
   *
   * @returns `true` when a fresh attempt could plausibly succeed — a token was
   * discarded and can be re-issued. `false` when the credential itself is
   * wrong, so retrying would only replay the same rejection.
   */
  onUnauthorized(): Promise<boolean>;

  /** Best-effort cleanup on shutdown. Never throws. */
  dispose(): Promise<void>;
}
