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
import type { ServiceOrder, ServiceOrderLine } from './service-order.model.js';

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
  closedAt: ['closed_at', 'data_fecho', 'finished_at'],
  registeredAt: ['system_entry_date', 'created_at'],
  expectedDeliveryAt: ['expected_delivery_date', 'data_entrega_prevista'],
  mileage: ['km_counter', 'kms', 'mileage'],
  mechanicId: ['mechanic_id', 'employee_id', 'funcionario_id'],
  priority: ['priority', 'prioridade'],
  total: ['total', 'valor_total', 'amount', 'net_total'],
} as const;

/** Line-item fields, shared by `lines` and `extra_lines`. */
const LINE_FIELDS = {
  id: ['id'],
  description: ['description', 'descricao'],
  quantity: ['quantity', 'quantidade'],
  unitPrice: ['unit_price', 'preco_unitario'],
  total: ['total', 'total_without_vat'],
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
    closedAt: readIsoDate(record, FIELDS.closedAt),
    registeredAt: readIsoDate(record, FIELDS.registeredAt),
    expectedDeliveryAt: readIsoDate(record, FIELDS.expectedDeliveryAt),
    mileage: readNumber(record, FIELDS.mileage),
    mechanicId: readIdentifier(record, FIELDS.mechanicId),
    priority: readNumber(record, FIELDS.priority),
    total: readNumber(record, FIELDS.total),
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
    .map((entry) => ({
      id: readIdentifier(entry, LINE_FIELDS.id),
      description: readString(entry, LINE_FIELDS.description),
      quantity: readNumber(entry, LINE_FIELDS.quantity),
      unitPrice: readNumber(entry, LINE_FIELDS.unitPrice),
      total: readNumber(entry, LINE_FIELDS.total),
    }));
}

export function toServiceOrders(records: readonly UpstreamRecord[]): ServiceOrder[] {
  return records.map(toServiceOrder).filter((order): order is ServiceOrder => order !== undefined);
}
