/**
 * Reading and writing `Set-Cookie`, without a dependency.
 *
 * WHY NOT `cookie-parser`
 * -----------------------
 * This service sets exactly one cookie and reads exactly one cookie. The two
 * functions below are the whole of what a parser library would provide here,
 * and they are small enough to read in full — which matters more than usual,
 * because the cookie *is* the session, so a bug in this file is an
 * authentication bug. It also keeps the dependency surface of a service that
 * holds a credential to the client's ERP as small as it can be.
 *
 * HEADER INJECTION
 * ----------------
 * `serialiseCookie` refuses a name or an attribute containing characters that
 * could close the header and start another one. Nothing here builds a cookie
 * from user input today, but that is a property of the current callers, not of
 * the function, and the check costs one comparison.
 */

export type SameSite = 'lax' | 'strict' | 'none';

export interface CookieOptions {
  /** Lifetime in seconds. `0` expires the cookie immediately. */
  readonly maxAgeSeconds?: number;
  readonly domain?: string;
  readonly path?: string;
  /** Defaults to `true`. Only a cookie JavaScript cannot read is a session. */
  readonly httpOnly?: boolean;
  readonly secure?: boolean;
  /** Defaults to `lax`. */
  readonly sameSite?: SameSite;
}

/** RFC 6265 `cookie-name`: a token — no separators, no control characters. */
const COOKIE_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/**
 * What a `Path` or `Domain` may contain.
 *
 * Deliberately narrower than the specification allows: these two attributes are
 * configuration, and every realistic value is a host name or an absolute path.
 * An allow-list of the characters those need cannot express `;`, `,`, a quote
 * or a newline, which is the whole point.
 */
const SAFE_ATTRIBUTE = /^[A-Za-z0-9\-._~/]+$/;

/**
 * Reads the `Cookie` request header.
 *
 * A malformed pair is skipped rather than throwing. The header is
 * attacker-controlled, and one unparseable cookie — set by an unrelated
 * application on the same domain — must not fail the request. A repeated name
 * keeps the first occurrence, which is the one browsers send for the most
 * specific path.
 */
export function parseCookies(header: string | undefined): ReadonlyMap<string, string> {
  const cookies = new Map<string, string>();

  if (!header) {
    return cookies;
  }

  for (const pair of header.split(';')) {
    const separator = pair.indexOf('=');

    if (separator < 1) {
      continue;
    }

    const name = pair.slice(0, separator).trim();

    if (!COOKIE_NAME.test(name) || cookies.has(name)) {
      continue;
    }

    const raw = pair.slice(separator + 1).trim();
    // A quoted value is legal, and the quotes are not part of it.
    const quoted = raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"');
    const value = quoted ? raw.slice(1, -1) : raw;

    try {
      cookies.set(name, decodeURIComponent(value));
    } catch {
      // A stray `%` is not valid percent-encoding. The value is kept verbatim
      // rather than dropped: it simply will not match a session.
      cookies.set(name, value);
    }
  }

  return cookies;
}

/** Builds one `Set-Cookie` header value. */
export function serialiseCookie(name: string, value: string, options: CookieOptions = {}): string {
  if (!COOKIE_NAME.test(name)) {
    throw new TypeError(`Invalid cookie name: ${JSON.stringify(name)}`);
  }

  // `encodeURIComponent` removes every character that could break out of the
  // header, so the value itself needs no separate check.
  const parts = [`${name}=${encodeURIComponent(value)}`];

  parts.push(`Path=${assertSafe('path', options.path ?? '/')}`);

  if (options.domain) {
    parts.push(`Domain=${assertSafe('domain', options.domain)}`);
  }

  if (options.maxAgeSeconds !== undefined) {
    const maxAge = Math.floor(options.maxAgeSeconds);

    if (!Number.isFinite(maxAge) || maxAge < 0) {
      throw new TypeError('maxAgeSeconds must be a non-negative, finite number.');
    }

    parts.push(`Max-Age=${maxAge}`);
    // `Expires` alongside it, for anything that ignores `Max-Age`. Browsers
    // prefer `Max-Age` when both are present, so the two cannot disagree.
    parts.push(`Expires=${new Date(Date.now() + maxAge * 1000).toUTCString()}`);
  }

  if (options.httpOnly ?? true) {
    parts.push('HttpOnly');
  }

  if (options.secure) {
    parts.push('Secure');
  }

  const sameSite = options.sameSite ?? 'lax';

  if (sameSite === 'none' && !options.secure) {
    // Browsers reject `SameSite=None` without `Secure` silently: the cookie is
    // never stored, and the symptom is a sign-in that appears to succeed
    // followed by a session that does not exist. Failing here names the cause.
    throw new TypeError('SameSite=None requires Secure.');
  }

  parts.push(`SameSite=${sameSite.charAt(0).toUpperCase()}${sameSite.slice(1)}`);

  return parts.join('; ');
}

function assertSafe(attribute: string, value: string): string {
  if (!SAFE_ATTRIBUTE.test(value)) {
    throw new TypeError(`Invalid cookie ${attribute}: ${JSON.stringify(value)}`);
  }

  return value;
}
