/**
 * How a work order's coded fields are written for a person.
 *
 * WHY THE CODES ARE SHOWN AS CODES
 * --------------------------------
 * OfficeGest does carry a `status_name`, but on this tenant it is an
 * untranslated token for most statuses — `n4482`, `n15443`, `n2856` — and a real
 * label for only two ("Trabalhos Complexos", "Colisao"). The backend therefore
 * publishes the short code, which is what the workshop already reads inside
 * OfficeGest itself, and passes `statusName` through only when it is genuinely
 * readable.
 *
 * Inventing Portuguese for the rest would be a guess printed as fact, on a
 * screen where the status decides whether a car can be handed back. So the code
 * is shown, and a confirmed name is shown beside it where one exists.
 */

/**
 * The status codes seen in this tenant's data, in the order the filter offers
 * them — commonest first, so the useful ones are not at the bottom of the list.
 *
 * Counted across the 621 jobs in the 2026 diary on 2026-09-08:
 * FAC 376, F 166, ENT 31, ESP 29, ANU 10, COL 4, VIT 3, TCP 1, MAR 1.
 *
 * A code that appears later still renders correctly everywhere — the column and
 * the badge show whatever the record carries. Only this filter list would need
 * the new entry.
 */
export const SERVICE_ORDER_STATUS_CODES = [
  'FAC',
  'F',
  'ENT',
  'ESP',
  'ANU',
  'COL',
  'VIT',
  'TCP',
  'MAR',
] as const;

/** The two labels OfficeGest actually spells out. */
const CONFIRMED_STATUS_NAMES: Readonly<Record<string, string>> = {
  TCP: 'Trabalhos Complexos',
  COL: 'Colisão',
};

/** What the status filter offers. */
export const SERVICE_ORDER_STATUS_OPTIONS: readonly {
  readonly value: string;
  readonly label: string;
}[] = SERVICE_ORDER_STATUS_CODES.map((code) => ({
  value: code,
  label: CONFIRMED_STATUS_NAMES[code] ? `${code} — ${CONFIRMED_STATUS_NAMES[code]}` : code,
}));

/**
 * The status as it should read on screen.
 *
 * Prefers the name the record itself carried, then a confirmed one, then the
 * bare code — never nothing, because a job with no status is a real state the
 * reader needs to see as such.
 */
export function formatServiceOrderStatus(
  status: string | undefined,
  statusName?: string,
): string | null {
  const code = status?.trim();

  if (!code) {
    return null;
  }

  return statusName?.trim() || CONFIRMED_STATUS_NAMES[code.toUpperCase()] || code;
}

/** `128400` → `128 400 km`, or nothing when the odometer was not recorded. */
export function formatMileageReading(mileage: number | undefined): string | null {
  // Zero is "not recorded" here rather than a car that has never moved: the
  // field defaults to 0 upstream when the mechanic leaves it blank.
  return typeof mileage === 'number' && mileage > 0
    ? `${mileage.toLocaleString('pt-PT')} km`
    : null;
}
