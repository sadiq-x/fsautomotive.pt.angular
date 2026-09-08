/**
 * OfficeGest record → `Appointment`.
 *
 * Each field is read through a list of candidate names because OfficeGest
 * documents its envelope but not the keys inside a record — see
 * `customer.mapper.ts`. Reading an unknown name is harmless: it yields
 * `undefined`, and the UI omits the field. The names below marked CONFIRMED
 * were verified against the live tenant with `npm run probe`.
 */
import {
  readBoolean,
  readIsoDate,
  readNumber,
  readString,
  type UpstreamRecord,
} from '../../integrations/officegest/officegest.record-readers.js';
import { isPlausiblePlate, normalisePlate } from '../vehicles/plate.js';
import {
  APPOINTMENT_STATUSES,
  type Appointment,
  type AppointmentStatus,
} from './appointment.model.js';

/**
 * CONFIRMED against the tenant on 2026-09-07, re-probed 2026-09-08.
 *
 * `startsAt` / `endsAt` are `start` / `end`. There is no status field: the
 * state is carried by three booleans, folded below. `customerId`, `plate` and
 * `notes` are genuinely absent from this tenant's appointment records, so they
 * stay `undefined` rather than being invented.
 *
 * `employee_id`, `priority` and `location` are present on every record and were
 * previously dropped on the floor — which is why the booking screen had nothing
 * to show beyond a title and two dates.
 */
const FIELDS = {
  id: ['id', 'codigo', 'code', 'appointment_id'],
  title: ['title', 'titulo', 'subject', 'assunto', 'description'],
  customerId: ['customer_id', 'cliente_id', 'customer', 'cliente', 'entity_id'],
  plate: ['plate', 'matricula', 'vehicle_plate'],
  startsAt: ['start', 'start_date', 'starts_at', 'data_inicio', 'date'],
  endsAt: ['end', 'end_date', 'ends_at', 'data_fim'],
  status: ['status', 'estado', 'state'],
  notes: ['notes', 'observacoes', 'obs', 'note'],
  employeeId: ['employee_id', 'funcionario_id', 'employee', 'user_id'],
  priority: ['priority', 'prioridade'],
  location: ['location', 'local', 'localizacao'],
} as const;

export function toAppointment(record: UpstreamRecord): Appointment | undefined {
  const id = readString(record, FIELDS.id);

  if (!id) {
    return undefined;
  }

  const title = readString(record, FIELDS.title);
  const plate = readString(record, FIELDS.plate);

  return {
    id,
    title,
    customerId: readString(record, FIELDS.customerId),
    // Upstream's own field first; the title is only consulted when there is
    // none, which on this tenant is always.
    plate: plate ? normalisePlate(plate) : plateFromTitle(title),
    startsAt: readIsoDate(record, FIELDS.startsAt),
    endsAt: readIsoDate(record, FIELDS.endsAt),
    status: readStatus(record) ?? deriveStatus(record),
    notes: readString(record, FIELDS.notes),
    // Numeric upstream, string here: an id is an opaque label, and publishing
    // it as a number invites arithmetic on it somewhere down the line.
    employeeId: readIdentifier(record, FIELDS.employeeId),
    priority: readString(record, FIELDS.priority),
    location: readString(record, FIELDS.location),
  };
}

/**
 * The registration plate this tenant writes at the front of the title.
 *
 * OfficeGest sends no `plate` on an appointment, but the workshop's own
 * convention is `AA-00-BB / what needs doing` — 92 of 100 bookings sampled from
 * the 2026 diary are written that way, and the eight that are not are staff
 * entries with no vehicle at all ("TIAGO FORMAÇÃO", "FERIAS DE 3/08 A 17/08").
 * So the plate is genuinely there; it is simply in the title.
 *
 * Reading it is what lets the bookings list show which car each row is about,
 * and lets a row link to the vehicle. It is deliberately anchored to the start
 * and must be followed by a separator or the end of the string: a looser search
 * would start finding plates inside dates and free text, and a wrong plate is
 * worse than none.
 *
 * It is also stricter than `isPlausiblePlate`, which accepts any six
 * alphanumerics on purpose so that a plate typed into a *plate field* is never
 * rejected. Here the input is arbitrary prose, and that looseness reads the
 * "FERIAS" of "FERIAS DE 3/08 A 17/08" as a registration. Every Portuguese
 * series mixes letters and digits, so requiring both is what separates a plate
 * from an ordinary six-letter word.
 */
function plateFromTitle(title: string | undefined): string | undefined {
  const match = /^\s*([A-Za-z0-9]{2}[-\s.]?[A-Za-z0-9]{2}[-\s.]?[A-Za-z0-9]{2})(?=$|[\s/,;-])/.exec(
    title ?? '',
  );

  if (!match?.[1]) {
    return undefined;
  }

  const normalised = normalisePlate(match[1]);
  const mixesLettersAndDigits = /[A-Z]/.test(normalised) && /[0-9]/.test(normalised);

  return isPlausiblePlate(normalised) && mixesLettersAndDigits ? normalised : undefined;
}

/**
 * An explicit upstream status, but only if it names a state we publish.
 *
 * This tenant sends no `status` field at all, so in practice `deriveStatus`
 * does the work. The check exists for the tenant that does send one: an
 * unrecognised value must not reach the model, or the closed union — which the
 * status filter and the badge colours both depend on — would be a lie.
 */
function readStatus(record: UpstreamRecord): AppointmentStatus | undefined {
  const raw = readString(record, FIELDS.status)?.toLowerCase();

  return APPOINTMENT_STATUSES.find((status) => status === raw);
}

/** An id that may arrive as a number or a string, as the opaque label it is. */
function readIdentifier(record: UpstreamRecord, keys: readonly string[]): string | undefined {
  const asNumber = readNumber(record, keys);

  return asNumber === undefined ? readString(record, keys) : String(asNumber);
}

/**
 * Folds the upstream booleans into the single status the model publishes.
 *
 * Ordered by finality: a booking that was completed is completed whatever else
 * is set, and a no-show outranks a confirmation that preceded it. `undefined`
 * rather than a default when none is set — inventing "scheduled" would state
 * something the record does not.
 */
function deriveStatus(record: UpstreamRecord): AppointmentStatus | undefined {
  if (readBoolean(record, ['completed'])) {
    return 'completed';
  }

  if (readBoolean(record, ['no_show'])) {
    return 'no_show';
  }

  if (readBoolean(record, ['confirmed'])) {
    return 'confirmed';
  }

  return undefined;
}

export function toAppointments(records: readonly UpstreamRecord[]): Appointment[] {
  return records
    .map(toAppointment)
    .filter((appointment): appointment is Appointment => appointment !== undefined);
}
