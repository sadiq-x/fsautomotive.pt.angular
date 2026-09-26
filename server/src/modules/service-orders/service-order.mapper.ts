/**
 * OfficeGest record → `ServiceOrder`.
 *
 * CONFIRMED against the tenant on 2026-09-07, re-probed 2026-09-08.
 *
 * THE ONE THAT MATTERED
 * ---------------------
 * A work order has no `id`. Its key is `number`, and `id` was the only
 * candidate — so `toServiceOrder` returned `undefined` for every record and
 * `toServiceOrders` filtered them all out. The endpoint answered 200 with a
 * full page of data and the list rendered "Ainda não há registos", which is
 * precisely the silent failure the candidate-list approach exists to avoid.
 *
 * THE ONE THAT MATTERED AFTER THAT
 * --------------------------------
 * `closedAt` read `closed_at`, `data_fecho` and `finished_at`, and the record
 * carries none of them — CONFIRMED against the real payload, which has 24
 * fields and no completion timestamp of any kind. The field was therefore
 * `undefined` on every work order ever mapped, and the detail page's "Fecho"
 * row never rendered. It is gone rather than left as a permanent blank.
 *
 * The consequence was thought to bound what this API can answer: that
 * **OfficeGest does not publish when a job finished**, so a completed repair's
 * real duration could not be derived at all. That turned out to be true only
 * of the *order* record. `/workshop/service-orders/{id}/times` — a sibling
 * endpoint, not a field on this one — is a genuine clock-in/clock-out log with
 * both `start_time` and `end_time` per entry, CONFIRMED 2026-09-26 with seven
 * fully-closed entries on one real order. See `toServiceOrderTimeEntry` below.
 *
 * THE ONE THAT MATTERED NEXT
 * --------------------------
 * Eight fields the record carries were never read: the customer's name, the
 * assigned mechanic, the mileage, the delivery date, the cancelled and
 * awaiting-parts flags, the priority and the entry date — plus the billed lines
 * on the detail record. The screen could therefore show a job without saying
 * whose car it was or what was done to it.
 */
import {
  readBoolean,
  readIsoDate,
  readNumber,
  readString,
  type UpstreamRecord,
} from '../../integrations/officegest/officegest.record-readers.js';
import { normalisePlate } from '../vehicles/plate.js';
import type {
  ServiceOrder,
  ServiceOrderLine,
  ServiceOrderTimeEntry,
} from './service-order.model.js';

const FIELDS = {
  id: ['number', 'id', 'document_number', 'codigo', 'code', 'service_order_id'],
  number: ['document_number', 'number', 'numero', 'nr'],
  plate: ['plate', 'matricula', 'vehicle_plate'],
  customerId: ['customer_id', 'cliente_id', 'customer', 'cliente'],
  customerName: ['invoice_name', 'customer_name', 'nome_cliente'],
  status: ['status', 'estado', 'state'],
  statusName: ['status_name', 'estado_nome'],
  // Detail-only upstream; a list row legitimately has none.
  description: ['observations', 'description', 'descricao', 'observacoes', 'notes'],
  mechanicNotes: ['mechanic_observations', 'observacoes_mecanico'],
  openedAt: ['date', 'opened_at', 'data_abertura', 'created_at'],
  registeredAt: ['system_entry_date', 'created_at'],
  expectedDeliveryAt: ['expected_delivery_date', 'data_entrega_prevista'],
  mileage: ['km_counter', 'kms', 'mileage'],
  mechanicId: ['mechanic_id', 'employee_id', 'funcionario_id'],
  priority: ['priority', 'prioridade'],
  total: ['total', 'valor_total', 'amount', 'net_total'],
} as const;

/**
 * Line-item fields, shared by `lines` and `extra_lines`.
 *
 * CONFIRMED 2026-09-13 against 158 real lines. Note the absence of `total`:
 * upstream does not send one, which is what made the old
 * `total: ['total', 'total_without_vat']` silently publish the net figure under
 * a gross label. The gross is computed in `readLines` instead.
 */
const LINE_FIELDS = {
  id: ['id'],
  lineNumber: ['line_number'],
  articleId: ['article_id'],
  description: ['description', 'descricao'],
  quantity: ['quantity', 'quantidade'],
  unitPrice: ['unit_price', 'preco_unitario'],
  unitPriceWithVat: ['unit_price_with_vat'],
  vatPercentage: ['vat_percentage'],
  discountPercentage: ['discount_percentage'],
  totalWithoutVat: ['total_without_vat'],
  vatValue: ['vat_value'],
} as const;

/**
 * An untranslated `status_name`.
 *
 * This tenant returns tokens like `n4482` and `n15443` for most statuses, and a
 * real label ("Trabalhos Complexos", "Colisao") for a couple. Showing `n4482`
 * to a mechanic is worse than showing the code they already recognise from
 * OfficeGest itself, so the token form is discarded.
 */
const UNTRANSLATED_STATUS = /^n\d+$/i;

export function toServiceOrder(record: UpstreamRecord): ServiceOrder | undefined {
  const id = readString(record, FIELDS.id);

  if (!id) {
    return undefined;
  }

  const plate = readString(record, FIELDS.plate);
  const statusName = readString(record, FIELDS.statusName);
  const lines = [...readLines(record, 'lines'), ...readLines(record, 'extra_lines')];
  const interventionMinutes = readInterventionMinutes(record);

  return {
    id,
    number: readString(record, FIELDS.number),
    // Normalised through the same function the vehicle module uses, so a job
    // and its vehicle can be matched on the plate without further work.
    plate: plate ? normalisePlate(plate) : undefined,
    customerId: readString(record, FIELDS.customerId),
    customerName: readString(record, FIELDS.customerName),
    // The code, always — it is what the list and the detail both show, so the
    // same job cannot read "FAC" in one place and "n4482" in the other.
    status: readString(record, FIELDS.status),
    statusName: statusName && !UNTRANSLATED_STATUS.test(statusName) ? statusName : undefined,
    cancelled: readBoolean(record, ['is_cancelled']),
    awaitingParts: readBoolean(record, ['awaiting_parts']),
    description: readString(record, FIELDS.description),
    mechanicNotes: readString(record, FIELDS.mechanicNotes),
    openedAt: readIsoDate(record, FIELDS.openedAt),
    registeredAt: readIsoDate(record, FIELDS.registeredAt),
    expectedDeliveryAt: readIsoDate(record, FIELDS.expectedDeliveryAt),
    mileage: readNumber(record, FIELDS.mileage),
    mechanicId: readIdentifier(record, FIELDS.mechanicId),
    priority: readNumber(record, FIELDS.priority),
    total: readNumber(record, FIELDS.total),
    estimatedMinutes: sumInterventionMinutes(interventionMinutes),
    interventionMinutes,
    // Absent rather than empty on a list row, so "no lines were billed" and
    // "this response does not carry lines" stay distinguishable.
    lines: lines.length > 0 ? lines : undefined,
  };
}

/** An id that may arrive as a number or a string, as the opaque label it is. */
function readIdentifier(record: UpstreamRecord, keys: readonly string[]): string | undefined {
  const asNumber = readNumber(record, keys);

  return asNumber === undefined ? readString(record, keys) : String(asNumber);
}

/**
 * The billed lines under one key.
 *
 * Anything that is not an object is skipped rather than throwing: this is
 * upstream data, and one malformed entry must not cost the whole job its
 * detail page.
 */
function readLines(record: UpstreamRecord, key: string): ServiceOrderLine[] {
  const raw = (record as Record<string, unknown>)[key];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((entry): entry is UpstreamRecord => typeof entry === 'object' && entry !== null)
    .map((entry) => {
      const totalWithoutVat = readNumber(entry, LINE_FIELDS.totalWithoutVat);
      const vatValue = readNumber(entry, LINE_FIELDS.vatValue);

      return {
        id: readIdentifier(entry, LINE_FIELDS.id),
        lineNumber: readNumber(entry, LINE_FIELDS.lineNumber),
        articleId: readIdentifier(entry, LINE_FIELDS.articleId),
        description: readString(entry, LINE_FIELDS.description),
        quantity: readNumber(entry, LINE_FIELDS.quantity),
        unitPrice: readNumber(entry, LINE_FIELDS.unitPrice),
        unitPriceWithVat: readNumber(entry, LINE_FIELDS.unitPriceWithVat),
        vatPercentage: readNumber(entry, LINE_FIELDS.vatPercentage),
        discountPercentage: readNumber(entry, LINE_FIELDS.discountPercentage),
        totalWithoutVat,
        vatValue,
        // Missing VAT is read as zero — a zero-rated line is a real thing — but
        // a missing *net* leaves the gross absent rather than inventing one.
        total: totalWithoutVat === undefined ? undefined : totalWithoutVat + (vatValue ?? 0),
      };
    });
}

/**
 * The time booked on each of this job's own interventions, in `line_number`
 * order — `null` for a line nobody timed.
 *
 * CONFIRMED 2026-09-26 against order 202600642: `estimated_time` is a real
 * number on all 5 of its interventions — 60, 30, 30, 30 and 330 minutes. The
 * lines carry no name (their `id` is the order number repeated, not a line
 * key); names only exist on the monitor's own intervention list, which is why
 * the order is kept here and `line_number` is the sort key. Across all 31
 * active orders the two lists had the same length and this one always came
 * back already sorted, which is what makes pairing them by position sound —
 * see `perLineMinutes` in `service-order-detail.ts`.
 *
 * Zero becomes `null` rather than staying `0`, the same rule the intervention
 * catalogue applies — a job nobody timed is not the same fact as a job that
 * takes no time. `undefined` when the record carries no interventions array
 * at all, which is the case on a list row.
 */
function readInterventionMinutes(record: UpstreamRecord): (number | null)[] | undefined {
  const raw = (record as Record<string, unknown>)['interventions'];

  if (!Array.isArray(raw)) {
    return undefined;
  }

  return raw
    .filter((entry): entry is UpstreamRecord => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      line: readNumber(entry, ['line_number']) ?? Number.POSITIVE_INFINITY,
      minutes: readNumber(entry, ['estimated_time']),
    }))
    .sort((a, b) => a.line - b.line)
    .map(({ minutes }) => (minutes !== undefined && minutes > 0 ? minutes : null));
}

/**
 * The whole job's booked time: the sum of every timed line.
 *
 * `undefined` when no line on the order carries a usable estimate, so "not
 * recorded" stays distinguishable from "recorded as zero".
 */
function sumInterventionMinutes(
  minutes: readonly (number | null)[] | undefined,
): number | undefined {
  const timed = (minutes ?? []).filter((value): value is number => value !== null);

  return timed.length > 0 ? timed.reduce((a, b) => a + b, 0) : undefined;
}

export function toServiceOrders(records: readonly UpstreamRecord[]): ServiceOrder[] {
  return records.map(toServiceOrder).filter((order): order is ServiceOrder => order !== undefined);
}

/**
 * `/workshop/service-orders/{id}/times` record → `ServiceOrderTimeEntry`.
 *
 * CONFIRMED 2026-09-26 against the live tenant and the published docs at
 * `.../times/get`: `id`, `employee_id`, `employee_name`, `start_time`,
 * `end_time` and `difference_minutes` all matched on 7 real entries across 2
 * mechanics on one order. `difference_hours` and `billable_hours` also exist
 * but as decimal strings ("1.50") duplicating `difference_minutes` in a less
 * convenient shape, so they are not read.
 */
const TIME_ENTRY_FIELDS = {
  id: ['id'],
  employeeId: ['employee_id'],
  employeeName: ['employee_name'],
  startedAt: ['start_time'],
  endedAt: ['end_time'],
  workedMinutes: ['difference_minutes'],
  interventionId: ['intervention_id'],
} as const;

export function toServiceOrderTimeEntry(record: UpstreamRecord): ServiceOrderTimeEntry | undefined {
  const id = readIdentifier(record, TIME_ENTRY_FIELDS.id);

  // Same rule as everywhere else: an entry that cannot be keyed cannot be
  // told apart from another one on the same list.
  if (!id) {
    return undefined;
  }

  return {
    id,
    employeeId: readIdentifier(record, TIME_ENTRY_FIELDS.employeeId),
    employeeName: readString(record, TIME_ENTRY_FIELDS.employeeName),
    startedAt: readIsoDate(record, TIME_ENTRY_FIELDS.startedAt),
    endedAt: readIsoDate(record, TIME_ENTRY_FIELDS.endedAt),
    workedMinutes: readNumber(record, TIME_ENTRY_FIELDS.workedMinutes),
    interventionId: readIdentifier(record, TIME_ENTRY_FIELDS.interventionId),
  };
}

export function toServiceOrderTimeEntries(
  records: readonly UpstreamRecord[],
): ServiceOrderTimeEntry[] {
  return records
    .map(toServiceOrderTimeEntry)
    .filter((entry): entry is ServiceOrderTimeEntry => entry !== undefined);
}
