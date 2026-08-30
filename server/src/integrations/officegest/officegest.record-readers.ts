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

/** A validated-but-unmapped upstream record. */
export type UpstreamRecord = Readonly<Record<string, unknown>>;

/** First candidate present with a non-empty value, or `undefined`. */
function firstPresent(record: UpstreamRecord, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
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

  // `YYYY-MM-DD HH:mm:ss` is the common SQL rendering; `T` makes it ISO.
  const candidate = typeof value === 'string' ? value.trim().replace(' ', 'T') : value;
  const parsed = new Date(candidate);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}
