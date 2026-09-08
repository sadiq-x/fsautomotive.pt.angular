/**
 * The session cookie: the one place it is read, set and cleared.
 *
 * Three small functions rather than three inline `res.append` calls, because
 * the attributes have to agree exactly. A cookie is only removable by a
 * `Set-Cookie` whose name, `Path` and `Domain` match the one that created it —
 * so a sign-out that spells any of them differently leaves the original cookie
 * in the browser and reports success. Deriving all three from the same config
 * object makes that class of bug unrepresentable.
 */
import type { Request, Response } from 'express';

import type { AuthCookieConfig } from '../../config/auth.config.js';
import { parseCookies, serialiseCookie } from '../../shared/http/cookies.js';

export function readSessionToken(req: Request, cookie: AuthCookieConfig): string | undefined {
  return parseCookies(req.headers.cookie).get(cookie.name);
}

export function setSessionCookie(
  res: Response,
  cookie: AuthCookieConfig,
  token: string,
  maxAgeSeconds: number,
): void {
  res.append(
    'Set-Cookie',
    serialiseCookie(cookie.name, token, {
      maxAgeSeconds,
      domain: cookie.domain,
      path: cookie.path,
      // Not negotiable, and therefore not a parameter: a session cookie
      // JavaScript can read is a session an XSS flaw can steal.
      httpOnly: true,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    }),
  );
}

/**
 * Expires the cookie.
 *
 * `Max-Age=0` with an empty value, rather than simply omitting the header:
 * clearing it is the visible half of signing out, and a browser that keeps a
 * stale cookie will keep sending it on every request for the rest of the day.
 * The session itself is destroyed server-side regardless, so this is about the
 * user seeing what they asked for — not about the security of the sign-out.
 */
export function clearSessionCookie(res: Response, cookie: AuthCookieConfig): void {
  res.append(
    'Set-Cookie',
    serialiseCookie(cookie.name, '', {
      maxAgeSeconds: 0,
      domain: cookie.domain,
      path: cookie.path,
      httpOnly: true,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    }),
  );
}
