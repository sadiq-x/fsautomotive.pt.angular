/**
 * OfficeGest record → `ServiceOrder`.
 *
 * ⚠️ Candidate field names are inferred, not published — see
 * `customer.mapper.ts`.
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
  id: ['id', 'codigo', 'code', 'service_order_id'],
  number: ['number', 'numero', 'document_number', 'nr'],
  plate: ['plate', 'matricula', 'vehicle_plate'],
  customerId: ['customer_id', 'cliente_id', 'customer', 'cliente'],
  status: ['status', 'estado', 'state'],
  description: ['description', 'descricao', 'observacoes', 'notes'],
  openedAt: ['opened_at', 'data_abertura', 'created_at', 'date'],
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
