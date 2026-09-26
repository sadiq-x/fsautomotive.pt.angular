import type { ServiceOrderLine } from '../../models';

/**
 * How a work order's coded fields are written for a person.
 *
 * WHY THE CODES ARE SHOWN AS CODES
 * --------------------------------
 * OfficeGest does carry a `status_name`, but on this tenant it is an
 * untranslated token for most statuses — `n4482`, `n15443`, `n2856`. The backend
 * therefore publishes the short code, which is what the workshop already reads
 * inside OfficeGest itself, and passes `statusName` through only when it is
 * genuinely readable.
 *
 * Inventing Portuguese for a code with no confirmed name would be a guess
 * printed as fact, on a screen where the status decides whether a car can be
 * handed back. So an unconfirmed code renders as itself, and a confirmed one
 * shows its real name — see `SERVICE_ORDER_STATUSES` for what "confirmed" means
 * for each entry.
 */

/**
 * One status OfficeGest can put a work order in: its code, and how a person
 * should read it.
 */
export interface ServiceOrderStatusInfo {
  /** The short code the API, and this tenant's own OfficeGest screen, both use. */
  readonly code: string;
  /** The full label, as OfficeGest's own status filter spells it out. */
  readonly name: string;
  /** A short label for a table cell or a badge — never longer than `name`. */
  readonly shortName: string;
}

/**
 * Every status with a confirmed name, commonest first.
 *
 * CONFIRMED 2026-09-26 by reading this tenant's own OfficeGest status filter
 * tabs directly (Serviço Box → Ordens de Serviço), which is a more reliable
 * source than `status_name` on the record — that field is a token for most of
 * these. Counts on that screen: Faturado 908, Fechado 178, Entregue 108,
 * Anulado 40, Em espera 31, Trabalhos Complexos 6, Viaturas Internas 5,
 * Colisão 4, Seguradoras 2.
 *
 * `EXE` is the one entry here that screen did not show a tab for. Its name
 * rests instead on the documented ESP/EXE/MAR active-state trio and this
 * codebase's own prior finding that OfficeGest calls it "Em Execução" — not on
 * a status-tab screenshot the way the rest of this list is. It is kept here
 * rather than left unconfirmed because that finding already existed
 * independently, in `workshop-monitor.service.ts`.
 *
 * `MAR` — the third member of that same trio — is deliberately absent: nothing
 * anywhere has ever shown a Portuguese name for it, so `formatServiceOrderStatus`
 * falls back to the bare code for it, as it does for anything else unlisted.
 */
export const SERVICE_ORDER_STATUSES: readonly ServiceOrderStatusInfo[] = [
  { code: 'FAC', name: 'Faturado', shortName: 'Faturado' },
  { code: 'F', name: 'Fechado', shortName: 'Fechado' },
  { code: 'ENT', name: 'Entregue', shortName: 'Entregue' },
  { code: 'ANU', name: 'Anulado', shortName: 'Anulado' },
  { code: 'ESP', name: 'Em espera', shortName: 'Espera' },
  { code: 'TCP', name: 'Trabalhos Complexos', shortName: 'Complexos' },
  { code: 'VIT', name: 'Viaturas Internas', shortName: 'V. Internas' },
  { code: 'COL', name: 'Colisão', shortName: 'Colisão' },
  { code: 'SEG', name: 'Seguradoras', shortName: 'Seguros' },
  { code: 'EXE', name: 'Em Execução', shortName: 'Execução' },
] as const;

/** `SERVICE_ORDER_STATUSES`, by code, for the one-status lookups below. */
const STATUS_BY_CODE: ReadonlyMap<string, ServiceOrderStatusInfo> = new Map(
  SERVICE_ORDER_STATUSES.map((status) => [status.code, status]),
);

/**
 * The status codes the filter offers, in the same order as
 * `SERVICE_ORDER_STATUSES` plus `MAR` — the one code seen in this tenant's data
 * with no confirmed name of its own. A code that appears later still renders
 * correctly everywhere else; only this filter list would need the new entry.
 */
export const SERVICE_ORDER_STATUS_CODES = [
  ...SERVICE_ORDER_STATUSES.map((status) => status.code),
  'MAR',
] as const;

/** What the status filter offers. */
export const SERVICE_ORDER_STATUS_OPTIONS: readonly {
  readonly value: string;
  readonly label: string;
}[] = SERVICE_ORDER_STATUS_CODES.map((code) => {
  const confirmed = STATUS_BY_CODE.get(code);

  return { value: code, label: confirmed ? `${code} — ${confirmed.name}` : code };
});

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

  return statusName?.trim() || STATUS_BY_CODE.get(code.toUpperCase())?.name || code;
}

/** `128400` → `128 400 km`, or nothing when the odometer was not recorded. */
export function formatMileageReading(mileage: number | undefined): string | null {
  // Zero is "not recorded" here rather than a car that has never moved: the
  // field defaults to 0 upstream when the mechanic leaves it blank.
  return typeof mileage === 'number' && mileage > 0
    ? `${mileage.toLocaleString('pt-PT')} km`
    : null;
}

/**
 * A work order's real total: the gross of every billed line, added up.
 *
 * THE ONLY CORRECT WAY TO GET THIS NUMBER
 * ----------------------------------------
 * `ServiceOrder.total` cannot be used for this — see its doc comment in
 * `service-order.model.ts`. CONFIRMED 2026-09-26 on order 202600642:
 * `order.total` reads `6.03`, which is not the job's cost, it is *exactly*
 * the gross of one line ("Taxa de resíduos"), while the real total of every
 * line — the same eco-tax plus the nine genuine billed items sitting in
 * `extra_lines` — is `409.54`. This was then found on every visible row of
 * the work-order list, all reading the identical `6.03 €`, which is what a
 * fixed eco-tax line present on every order and never joined to the rest of
 * the bill looks like from the outside.
 *
 * `undefined` when there is nothing to sum — no lines at all, or every line
 * missing its own `total` — so "not billed for anything yet" and "billed for
 * nothing" stay distinguishable, the same rule every sum in this codebase
 * follows.
 */
export function computeBilledTotal(lines: readonly ServiceOrderLine[] | undefined): number | undefined {
  if (!lines || lines.length === 0) {
    return undefined;
  }

  const totals = lines
    .map((line) => line.total)
    .filter((value): value is number => value !== undefined);

  return totals.length > 0 ? totals.reduce((a, b) => a + b, 0) : undefined;
}
