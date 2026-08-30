/**
 * Who is signed in, and what they may do.
 *
 * Permissions are a closed union rather than `string`, so a typo in a guard or
 * a template is a compile error instead of a silently hidden button.
 */

/**
 * Permissions the private area understands.
 *
 * ⚠️ These names are this application's convention — the backend does not yet
 * issue them (see `auth.contract.ts`). Align them with whatever your identity
 * provider returns; the union is the single place to change.
 */
export type Permission =
  | 'officegest.read'
  | 'officegest.write'
  | 'officegest.customers.read'
  | 'officegest.vehicles.read'
  | 'officegest.service-orders.read'
  | 'officegest.appointments.read'
  | 'officegest.appointments.write';

export type Role = 'ADMIN' | 'MANAGER' | 'USER';

export interface SessionUser {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly role: Role;
  readonly permissions: readonly Permission[];
}

export interface Credentials {
  readonly email: string;
  readonly password: string;
}

/**
 * `unknown` is a real state, not a placeholder: on first paint the app has not
 * yet asked the backend whether the cookie is valid. A guard that treats
 * `unknown` as "anonymous" would bounce a signed-in user to the login page on
 * every refresh, which is the classic bug this state exists to prevent.
 */
export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';
