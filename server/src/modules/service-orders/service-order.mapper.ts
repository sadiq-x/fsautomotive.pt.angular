/**
 * OfficeGest record → `ServiceOrder`.
 *
 * CONFIRMED against the tenant on 2026-09-07.
 *
 * THE ONE THAT MATTERED
 * ---------------------
 * A work order has no `id`. Its key is `number`, and `id` was the only
 * candidate — so `toServiceOrder` returned `undefined` for every record and
 * `toServiceOrders` filtered them all out. The endpoint answered 200 with a
 * full page of data and the list rendered "Ainda não há registos", which is
 * precisely the silent failure the candidate-list approach exists to avoid.
 */
import {
  readIsoDate,
  readNumber,
  readString,
  type UpstreamRecord,
} from '../../integrations/officegest/officegest.record-readers.js';
import { normalisePlate } from '../vehicles/plate.js';
import type { ServiceOrder } from './service-order.model.js';

const FIELDS = {
  id: ['number', 'id', 'document_number', 'codigo', 'code', 'service_order_id'],
  number: ['document_number', 'number', 'numero', 'nr'],
  plate: ['plate', 'matricula', 'vehicle_plate'],
  customerId: ['customer_id', 'cliente_id', 'customer', 'cliente'],
  // `status_name` is the readable one, and only the detail endpoint sends it.
  status: ['status_name', 'status', 'estado', 'state'],
  // Detail-only upstream; a list row legitimately has none.
  description: ['observations', 'description', 'descricao', 'observacoes', 'notes'],
  openedAt: ['date', 'system_entry_date', 'opened_at', 'data_abertura', 'created_at'],
  closedAt: ['closed_at', 'data_fecho', 'finished_at'],
  total: ['total', 'valor_total', 'amount', 'net_total'],
} as const;

export function toServiceOrder(record: UpstreamRecord): ServiceOrder | undefined {
  const id = readString(record, FIELDS.id);

  if (!id) {
    return undefined;
  }

  const plate = readString(record, FIELDS.plate);

  return {
    id,
    number: readString(record, FIELDS.number),
    // Normalised through the same function the vehicle module uses, so a job
    // and its vehicle can be matched on the plate without further work.
    plate: plate ? normalisePlate(plate) : undefined,
    customerId: readString(record, FIELDS.customerId),
    status: readString(record, FIELDS.status),
    description: readString(record, FIELDS.description),
    openedAt: readIsoDate(record, FIELDS.openedAt),
    closedAt: readIsoDate(record, FIELDS.closedAt),
    total: readNumber(record, FIELDS.total),
  };
}

export function toServiceOrders(records: readonly UpstreamRecord[]): ServiceOrder[] {
  return records.map(toServiceOrder).filter((order): order is ServiceOrder => order !== undefined);
}
