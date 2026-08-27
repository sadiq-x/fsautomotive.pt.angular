/**
 * Ambient typings for the gtag.js globals.
 *
 * These live in a declaration file rather than inside the service because a
 * `declare global` block in a module is easy to lose track of, and because the
 * shape belongs to the page, not to any one consumer.
 *
 * `gtag` is deliberately typed loosely at the boundary: its real signature is a
 * set of unrelated overloads keyed by the first argument (`'js' | 'config' |
 * 'event' | 'consent' | 'set'`), and modelling all of them buys nothing when
 * `AnalyticsService` is the only caller and already types its own API strictly.
 * `unknown[]` keeps it honest — no `any` reaches the app.
 */
declare global {
  interface Window {
    /** gtag.js's command queue. Calls made before the library loads land here. */
    dataLayer?: unknown[];
    /** The gtag shim, or the real function once the library has loaded. */
    gtag?: (...args: unknown[]) => void;
  }
}

export {};
