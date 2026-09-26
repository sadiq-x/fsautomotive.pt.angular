/**
 * Typed readers for upstream records whose exact field names are not published.
 *
 * WHY THIS EXISTS
 * ---------------
 * OfficeGest documents its envelope (`{ data, meta }`), its authentication and
 * its paths, but not the field names inside each record. Two bad options follow
 * from that, and this is the third:
 *
 * 1. Pin one guessed name per field. One wrong guess silently produces
 *    `undefined`, and the API answers with well-formed, empty objects — the
 *    worst kind of bug, because nothing fails.
 * 2. Forward the raw upstream record. That publishes OfficeGest's schema as our
 *    own, exposes fields nobody vetted, and makes any upstream rename a
 *    breaking change for the front end.
 * 3. Read each field through a short, explicit list of candidate names, and
 *    keep those lists in the resource file next to the mapper.
 *
 * The candidates cover the naming conventions the API actually mixes —
 * `snake_case` English and Portuguese domain terms. Once a tenant's real
 * payloads are known, trimming each list to the single correct name is a safe,
 * mechanical edit; nothing else has to change.
 */
import { OFFICEGEST_TIME_ZONE } from './officegest.constants.js';

/** A validated-but-unmapped upstream record. */
export type UpstreamRecord = Readonly<Record<string, unknown>>;

/**
 * First candidate present with a non-empty value, or `undefined`.
 *
 * A candidate may be a dotted path — `country.name` — because OfficeGest
 * expands some foreign keys into nested objects (`country`, `district`) while
 * leaving others flat. Without this, `readString` handed such an object to a
 * `typeof value === 'string'` check, failed it, and returned `undefined`: a
 * field that is plainly present upstream read as missing, and nothing failed.
 */
function firstPresent(record: UpstreamRecord, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = key.includes('.') ? resolvePath(record, key) : record[key];

    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
}

/** Walks a dotted path, stopping at anything that is not a plain object. */
function resolvePath(record: UpstreamRecord, path: string): unknown {
  let current: unknown = record;

  for (const segment of path.split('.')) {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

/** Reads a string, coercing the numbers that identifier fields often arrive as. */
export function readString(record: UpstreamRecord, keys: readonly string[]): string | undefined {
  const value = firstPresent(record, keys);

  if (typeof value === 'string') {
    return value.trim() || undefined;
  }

  return typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined;
}

/** Reads a number, accepting the numeric strings a PHP backend commonly emits. */
export function readNumber(record: UpstreamRecord, keys: readonly string[]): number | undefined {
  const value = firstPresent(record, keys);

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

/** Reads a boolean, accepting `1`/`0` and `"true"`/`"false"`. */
export function readBoolean(record: UpstreamRecord, keys: readonly string[]): boolean | undefined {
  const value = firstPresent(record, keys);

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'sim'].includes(normalised)) {
      return true;
    }

    if (['false', '0', 'no', 'nao', 'não'].includes(normalised)) {
      return false;
    }
  }

  return undefined;
}

/**
 * Reads a date and normalises it to an ISO-8601 string.
 *
 * Normalising at the boundary means the front end never has to guess whether it
 * received `2026-08-28 09:30:00` or `28/08/2026`. An unparseable value is
 * dropped rather than forwarded: a date the client cannot parse is worse than
 * no date, because it looks usable.
 */
export function readIsoDate(record: UpstreamRecord, keys: readonly string[]): string | undefined {
  const value = firstPresent(record, keys);

  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  if (typeof value === 'string') {
    // The common SQL rendering carries no offset, and `new Date()` would read
    // it in the *server's* zone — see `OFFICEGEST_TIME_ZONE`. Anything else
    // (a date alone, an ISO string with its own offset) keeps its meaning.
    const naive = NAIVE_DATE_TIME.exec(value.trim());

    if (naive) {
      return wallClockToIso(naive, OFFICEGEST_TIME_ZONE);
    }
  }

  // `T` makes the SQL rendering ISO, as it always has for anything above.
  const parsed = new Date(typeof value === 'string' ? value.trim().replace(' ', 'T') : value);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

/**
 * `YYYY-MM-DD HH:mm[:ss[.fff]]`, space- or `T`-separated, with no offset.
 * Fractional seconds are accepted and dropped — nothing here is timed to the
 * millisecond.
 */
const NAIVE_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;

/**
 * A wall-clock reading in `timeZone`, as the UTC instant it names.
 *
 * Offsets are looked up with `Intl` rather than hard-coded, so both daylight-
 * saving changeovers are handled. The offset is taken once at the naive guess
 * and once more at the corrected instant, which settles any real zone. An
 * impossible date (`2026-13-40`) is rejected rather than rolled over, the way
 * `new Date()` rejected it before.
 */
function wallClockToIso(parts: RegExpExecArray, timeZone: string): string | undefined {
  // An absent seconds group reads as 0; every other group is mandatory in the pattern.
  const group = (index: number): number => Number(parts[index] ?? 0);
  const [year, month, day, hour, minute, second] = [1, 2, 3, 4, 5, 6].map(group) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const wall = Date.UTC(year, month - 1, day, hour, minute, second);
  const check = new Date(wall);

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    check.getUTCHours() !== hour ||
    check.getUTCMinutes() !== minute
  ) {
    return undefined;
  }

  const firstGuess = wall - zoneOffsetMs(wall, timeZone);

  return new Date(wall - zoneOffsetMs(firstGuess, timeZone)).toISOString();
}

/** How far `timeZone`'s wall clock is ahead of UTC at `instant`, in ms. */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = zoneFormatter(timeZone).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((entry) => entry.type === type)?.value);

  const asUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );

  return asUtc - Math.floor(instant / 1000) * 1000;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/** One cached formatter per zone — building them is the expensive part. */
function zoneFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }

  return formatter;
}
