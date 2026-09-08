/**
 * Who may sign in, and what they may do.
 *
 * THE PERMISSION UNION IS A CONTRACT WITH THE BROWSER
 * ---------------------------------------------------
 * These strings are mirrored in `src/app/core/auth/auth.models.ts`. The Angular
 * side uses them to decide which links to render; this side uses them to decide
 * which requests to answer. Only the second one is a security control — a
 * hidden button is a courtesy, not a boundary — but they must agree, or the
 * private area shows a page whose data the backend then refuses.
 *
 * Keeping it a closed union rather than `string` means a typo in a guard is a
 * compile error here and a rejected configuration at startup, instead of a
 * silently locked-out user.
 */

export const PERMISSIONS = [
  /** Umbrella grant for every read-only OfficeGest view. */
  'officegest.read',
  'officegest.write',
  'officegest.customers.read',
  'officegest.vehicles.read',
  'officegest.service-orders.read',
  'officegest.appointments.read',
  'officegest.appointments.write',
  // Not OfficeGest-backed, so deliberately outside that namespace: the
  // `officegest.read` umbrella must not reach them.
  'workers.read',
  'settings.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ['ADMIN', 'MANAGER', 'USER'] as const;

export type Role = (typeof ROLES)[number];

/**
 * What `GET /api/auth/session` returns, and what the browser holds in memory.
 *
 * Note what is absent: no password hash, no session id, no internal
 * identifiers. This type is the *whole* of what leaves the service about a
 * user, which is why the mapping to it lives in one function
 * (`toSessionUser`) rather than at each call site.
 */
export interface SessionUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly permissions: readonly Permission[];
}

/** A configured account, as loaded from `AUTH_USERS` / `AUTH_USERS_FILE`. */
export interface AuthUser extends SessionUser {
  /** `scrypt$N$r$p$salt$hash`. Never leaves this process. */
  readonly passwordHash: string;
  /** `true` suspends the account without deleting its configuration. */
  readonly disabled: boolean;
}

/** The only way an `AuthUser` becomes something a response may contain. */
export function toSessionUser(user: AuthUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  };
}

/**
 * Whether a set of granted permissions satisfies a requirement.
 *
 * `officegest.read` is the umbrella for every read-only OfficeGest view, so a
 * simple deployment can issue one permission instead of five. It is scoped to
 * its own namespace on purpose: `workers.read` and `settings.read` guard
 * screens that are not OfficeGest data, and a grant named after one system must
 * not silently open another.
 *
 * Kept in step with `AuthService.hasPermission` in the Angular application — if
 * one changes, change both. A test on each side holds them together.
 */
export function grants(granted: readonly Permission[], required: Permission): boolean {
  return (
    granted.includes(required) ||
    (required.startsWith('officegest.') &&
      required.endsWith('.read') &&
      granted.includes('officegest.read'))
  );
}

/** Whether any one of the requirements is met. An empty list requires nothing. */
export function grantsAny(
  granted: readonly Permission[],
  required: readonly Permission[],
): boolean {
  return required.length === 0 || required.some((permission) => grants(granted, permission));
}
