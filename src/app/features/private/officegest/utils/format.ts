/**
 * Display formatting for OfficeGest values.
 *
 * Centralised because these are decisions, not conveniences: which locale, what
 * a missing value looks like, whether a date shows its time. Made once, they
 * are consistent across every table and detail page; made per template, the
 * same date appears three ways on three screens.
 *
 * Everything returns `null` for "nothing to show", which is what the table and
 * the detail list render as a dash. Returning `''` instead would produce cells
 * that look broken rather than empty.
 */

const LOCALE = 'pt-PT';

/** `2026-08-28T09:30:00Z` → `28/08/2026`. */
export function formatDate(iso: string | undefined): string | null {
  const date = parse(iso);
  return date
    ? date.toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;
}

/** `2026-08-28T09:30:00Z` → `28/08/2026, 09:30`. */
export function formatDateTime(iso: string | undefined): string | null {
  const date = parse(iso);

  return date
    ? date.toLocaleString(LOCALE, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
}

/** `1234.5` → `1 234,50 €`. */
export function formatCurrency(value: number | undefined): string | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString(LOCALE, { style: 'currency', currency: 'EUR' })
    : null;
}

/** `123456` → `123 456 km`. */
export function formatMileage(value: number | undefined): string | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toLocaleString(LOCALE)} km`
    : null;
}

/**
 * `AA00BB` → `AA-00-BB`.
 *
 * The backend stores and addresses vehicles by the unseparated form, so this is
 * strictly for display — never for building a URL.
 */
export function formatPlate(plate: string | undefined): string | null {
  if (!plate) {
    return null;
  }

  return /^[A-Z0-9]{6}$/i.test(plate)
    ? `${plate.slice(0, 2)}-${plate.slice(2, 4)}-${plate.slice(4, 6)}`.toUpperCase()
    : plate.toUpperCase();
}

/** Trims and collapses a value to `null` when it carries nothing. */
export function orNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** `true` → `Ativo`. Undefined stays unknown rather than defaulting to inactive. */
export function formatActive(active: boolean | undefined): string | null {
  return active === undefined ? null : active ? 'Ativo' : 'Inativo';
}

function parse(iso: string | undefined): Date | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}
