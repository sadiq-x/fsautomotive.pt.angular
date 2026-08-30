/**
 * OfficeGest record → `Appointment`, and the DTO → upstream payload direction.
 *
 * ⚠️ Candidate field names are inferred, not published — see
 * `customer.mapper.ts`. The *write* direction carries more risk than the read
 * one: reading an unknown field yields `undefined`, but writing one may be
 * silently ignored by OfficeGest, which looks like success. Confirm the create
 * payload against your tenant's documentation before relying on it.
 */
import {
  readIsoDate,
  readString,
  type UpstreamRecord,
} from '../../integrations/officegest/officegest.record-readers.js';
import { normalisePlate } from '../vehicles/plate.js';
import type { CreateAppointmentBody } from './appointment.dto.js';
import type { Appointment } from './appointment.model.js';

const FIELDS = {
  id: ['id', 'codigo', 'code', 'appointment_id'],
  title: ['title', 'titulo', 'subject', 'assunto', 'description'],
  customerId: ['customer_id', 'cliente_id', 'customer', 'cliente', 'entity_id'],
  plate: ['plate', 'matricula', 'vehicle_plate'],
  startsAt: ['start_date', 'starts_at', 'data_inicio', 'start', 'date'],
  endsAt: ['end_date', 'ends_at', 'data_fim', 'end'],
  status: ['status', 'estado', 'state'],
  notes: ['notes', 'observacoes', 'obs', 'note'],
} as const;

export function toAppointment(record: UpstreamRecord): Appointment | undefined {
  const id = readString(record, FIELDS.id);

  if (!id) {
    return undefined;
  }

  const plate = readString(record, FIELDS.plate);

  return {
    id,
    title: readString(record, FIELDS.title),
    customerId: readString(record, FIELDS.customerId),
    plate: plate ? normalisePlate(plate) : undefined,
    startsAt: readIsoDate(record, FIELDS.startsAt),
    endsAt: readIsoDate(record, FIELDS.endsAt),
    status: readString(record, FIELDS.status),
    notes: readString(record, FIELDS.notes),
  };
}

export function toAppointments(records: readonly UpstreamRecord[]): Appointment[] {
  return records
    .map(toAppointment)
    .filter((appointment): appointment is Appointment => appointment !== undefined);
}

/**
 * `CreateAppointmentBody` → the upstream create payload.
 *
 * ⚠️ INFERRED field names. Only fields the caller actually supplied are sent:
 * an explicit `null` for an untouched optional field is a different statement
 * from omitting it, and the safe one is to say nothing.
 */
export function toCreatePayload(body: CreateAppointmentBody): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: body.title,
    start_date: body.startsAt,
  };

  if (body.endsAt !== undefined) {
    payload['end_date'] = body.endsAt;
  }

  if (body.customerId !== undefined) {
    payload['customer_id'] = body.customerId;
  }

  if (body.plate !== undefined) {
    payload['plate'] = body.plate;
  }

  if (body.notes !== undefined) {
    payload['notes'] = body.notes;
  }

  return payload;
}
