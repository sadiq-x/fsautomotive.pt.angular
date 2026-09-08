/**
 * Password hashing, with `scrypt` from the standard library.
 *
 * WHY SCRYPT AND NOT BCRYPT OR ARGON2
 * -----------------------------------
 * Both of those are native modules: a compiler on the deployment host, a
 * rebuild on every Node upgrade, and a third-party dependency in the one place
 * a supply-chain compromise is worth the most to an attacker. `node:crypto`
 * ships scrypt, which is a memory-hard function designed for exactly this and
 * is what OWASP lists as an acceptable choice when Argon2id is unavailable. For
 * a handful of workshop accounts that trade is clearly the right way round.
 *
 * WHY THE PARAMETERS ARE STORED IN THE HASH
 * -----------------------------------------
 * `scrypt$N$r$p$salt$hash` carries the cost parameters with the digest, so
 * raising them later does not invalidate existing hashes: an old password keeps
 * verifying against its own parameters, and is re-hashed at its owner's next
 * password change. A bare digest would make the cost a global constant that can
 * never be changed without resetting every account.
 *
 * WHAT THIS FILE DOES NOT DO
 * --------------------------
 * Decide *whether* a user exists. `verifyPassword` answers one question and
 * takes the same time whichever way it answers; the enumeration defence lives
 * in `auth.service.ts`, which spends that time even for an unknown address.
 */
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/** The identifier this module writes and the only one it reads. */
const SCHEME = 'scrypt';

const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * Cost parameters for new hashes.
 *
 * `N = 2^15` with `r = 8` costs roughly 32 MiB and ~100 ms per verification on
 * a small server — enough to make offline cracking expensive, little enough
 * that a sign-in still feels immediate and that the login rate limit, not the
 * CPU, is what bounds a burst of attempts.
 */
export const DEFAULT_SCRYPT_PARAMS = { N: 32_768, r: 8, p: 1 } as const;

export interface ScryptParams {
  readonly N: number;
  readonly r: number;
  readonly p: number;
}

/**
 * `maxmem` must exceed the working set or Node refuses to derive the key. The
 * formula is scrypt's own (128 · N · r), with a factor of two of headroom for
 * the internal buffers — computed from the parameters rather than fixed, so a
 * stored hash with higher costs still verifies.
 */
function maxmemFor(params: ScryptParams): number {
  return 2 * 128 * params.N * params.r + 1024 * 1024;
}

/**
 * Bounds on what will be *read* from configuration.
 *
 * A hash is loaded from a file, and a hostile or mistyped `N` of 2^30 would
 * turn one sign-in attempt into an out-of-memory crash — a denial of service
 * written in a config file. The ceiling is well above any sane cost and far
 * below anything that could exhaust a server.
 */
const MAX_N = 1 << 20;
const MAX_R = 32;
const MAX_P = 16;

/** Thrown when a stored hash cannot be interpreted. Never contains the hash. */
export class PasswordHashFormatError extends Error {
  override readonly name = 'PasswordHashFormatError';

  constructor(reason: string) {
    super(`Unusable password hash: ${reason}`);
  }
}

interface ParsedHash {
  readonly params: ScryptParams;
  readonly salt: Buffer;
  readonly key: Buffer;
}

function parsePositiveInt(raw: string, name: string, max: number): number {
  const value = Number(raw);

  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new PasswordHashFormatError(`${name} must be an integer between 1 and ${max}`);
  }

  return value;
}

/** `scrypt$N$r$p$saltBase64$keyBase64` → its parts. */
function parseHash(encoded: string): ParsedHash {
  const parts = encoded.split('$');

  if (parts.length !== 6 || parts[0] !== SCHEME) {
    throw new PasswordHashFormatError(`expected ${SCHEME}$N$r$p$salt$hash`);
  }

  const [, rawN, rawR, rawP, rawSalt, rawKey] = parts as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];

  const params: ScryptParams = {
    N: parsePositiveInt(rawN, 'N', MAX_N),
    r: parsePositiveInt(rawR, 'r', MAX_R),
    p: parsePositiveInt(rawP, 'p', MAX_P),
  };

  // scrypt requires N to be a power of two, and would otherwise throw from
  // inside the derivation — a 500 at sign-in rather than a startup failure.
  if ((params.N & (params.N - 1)) !== 0) {
    throw new PasswordHashFormatError('N must be a power of two');
  }

  const salt = Buffer.from(rawSalt, 'base64');
  const key = Buffer.from(rawKey, 'base64');

  if (salt.length < 8) {
    throw new PasswordHashFormatError('the salt is too short');
  }

  if (key.length < 16) {
    throw new PasswordHashFormatError('the digest is too short');
  }

  return { params, salt, key };
}

/**
 * Whether a string is a hash this module can verify.
 *
 * Used at startup so a mistyped hash fails the process rather than one user's
 * sign-in, months later, with a stack trace instead of an explanation.
 */
export function isPasswordHash(value: string): boolean {
  try {
    parseHash(value);
    return true;
  } catch {
    return false;
  }
}

/** Hashes a password for storage. Used by `npm run hash:password`. */
export async function hashPassword(
  password: string,
  params: ScryptParams = DEFAULT_SCRYPT_PARAMS,
): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scryptAsync(normalise(password), salt, KEY_BYTES, {
    ...params,
    maxmem: maxmemFor(params),
  });

  return [
    SCHEME,
    params.N,
    params.r,
    params.p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$');
}

/**
 * Checks a password against a stored hash.
 *
 * Returns `false` for an unusable hash rather than throwing: startup has
 * already rejected those, so reaching one here means the configuration changed
 * underneath a running process, and refusing the sign-in is the safe reading.
 */
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  let parsed: ParsedHash;

  try {
    parsed = parseHash(encoded);
  } catch {
    return false;
  }

  const derived = await scryptAsync(normalise(password), parsed.salt, parsed.key.length, {
    ...parsed.params,
    maxmem: maxmemFor(parsed.params),
  });

  // Both buffers are `parsed.key.length` by construction, so `timingSafeEqual`
  // cannot throw on a length mismatch.
  return timingSafeEqual(derived, parsed.key);
}

/**
 * Unicode normalisation before hashing.
 *
 * "ã" can be typed as one code point or as "a" plus a combining tilde. They
 * look identical, they are the same password to the person typing it, and
 * without this they hash differently — a bug that surfaces as "it works on my
 * keyboard but not on the workshop's tablet", which is close to undebuggable.
 */
function normalise(password: string): string {
  return password.normalize('NFKC');
}
