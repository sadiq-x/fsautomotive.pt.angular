/**
 * OfficeGest monitor record → `MonitorServiceOrder`.
 *
 * CONFIRMED against the tenant on 2026-09-13, and against the published docs
 * for `/workshop/monitor` and `/workshop/monitor/service-orders`.
 *
 * WHY THE CANDIDATE LISTS ARE SHORT HERE
 * --------------------------------------
 * Unlike the older mappers, these field names come from documentation *and* a
 * live probe that agreed with it, so most read a single name. Where a second
 * candidate appears it is because the two monitor endpoints genuinely differ:
 * the active board sends `document_number`, the full monitor does not.
 *
 * WHAT THE TENANT DOES NOT SEND
 * -----------------------------
 * `mechanics` is an empty array on all 1 200 rows, and `duration` and
 * `sequence_number` have never appeared on any of 2 043 intervention entries.
 * The fields are read anyway, because they are documented and the mapper must
 * be correct on the day the workshop starts clocking on — not rewritten then.
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
  MonitorIntervention,
  MonitorMechanic,
  MonitorRosterEntry,
  MonitorServiceOrder,
  MonitorVehicle,
} from './workshop-monitor.model.js';

const FIELDS = {
  id: ['number', 'num'],
  documentNumber: ['document_number'],
  status: ['status'],
  openedAt: ['date'],
  customerId: ['customer_id'],
  customerName: ['invoice_name'],
  plate: ['vehicle_plate'],
  awaitingParts: ['awaiting_parts'],
  priority: ['priority'],
  completion: ['completion_percentage'],
  estimatedCompletionAt: ['estimated_completion_date'],
  expectedDeliveryAt: ['expected_delivery_date'],
  badgeColor: ['badge_color'],
} as const;

const VEHICLE_FIELDS = {
  plate: ['plate'],
  description: ['description'],
  manufacturingYear: ['manufacturing_year'],
  mileage: ['km_counter'],
  brand: ['brand_name'],
  model: ['model_name'],
  version: ['version_name'],
  fuel: ['fuel_name'],
} as const;

const MECHANIC_FIELDS = {
  employeeCode: ['employee_code'],
  name: ['name'],
  startedAt: ['start_time'],
  showInMonitor: ['show_in_monitor'],
} as const;

const INTERVENTION_FIELDS = {
  sequenceNumber: ['sequence_number'],
  name: ['intervention'],
  completed: ['completed'],
  duration: ['duration'],
} as const;

/**
 * The intervention catalogue → estimated minutes, keyed by folded description.
 *
 * Keyed by *name* because that is the only join that works: a work order's
 * intervention ids are document references, not catalogue ids. The key is
 * upper-cased and trimmed so a stray case or space difference between the
 * monitor and the price list does not silently lose the estimate — 23 of 23
 * names matched on this tenant once folded.
 *
 * Entries with a zero time are omitted rather than stored as `0`, so "no
 * estimate recorded" does not render as "estimated: zero minutes".
 */
export function toInterventionEstimates(
  records: readonly UpstreamRecord[],
): ReadonlyMap<string, number> {
  const estimates = new Map<string, number>();

  for (const record of records) {
    const description = readString(record, ['description']);
    const minutes = readNumber(record, ['estimated_time']);

    if (description && minutes !== undefined && minutes > 0) {
      estimates.set(foldName(description), minutes);
    }
  }

  return estimates;
}

/** The comparison key both sides of the name join are reduced to. */
export function foldName(value: string): string {
  return value.trim().toUpperCase();
}

export function toMonitorServiceOrder(
  record: UpstreamRecord,
  /** Estimated minutes by folded intervention name; empty when unavailable. */
  estimates: ReadonlyMap<string, number> = new Map(),
): MonitorServiceOrder | undefined {
  const id = readString(record, FIELDS.id);

  // Same rule as the service-order mapper: a record without its key cannot be
  // linked to anything, and a card that opens nothing is worse than no card.
  if (!id) {
    return undefined;
  }

  const plate = readString(record, FIELDS.plate);

  return {
    id,
    documentNumber: readString(record, FIELDS.documentNumber),
    status: readString(record, FIELDS.status),
    openedAt: readIsoDate(record, FIELDS.openedAt),
    customerId: readString(record, FIELDS.customerId),
    customerName: readString(record, FIELDS.customerName),
    plate: plate ? normalisePlate(plate) : undefined,
    vehicle: readVehicle(record),
    awaitingParts: readBoolean(record, FIELDS.awaitingParts),
    priority: readNumber(record, FIELDS.priority),
    completionPercentage: readCompletion(record),
    estimatedCompletionAt: readIsoDate(record, FIELDS.estimatedCompletionAt),
    expectedDeliveryAt: readIsoDate(record, FIELDS.expectedDeliveryAt),
    badgeColor: readString(record, FIELDS.badgeColor),
    interventions: readInterventions(record, estimates),
    mechanics: readMechanics(record),
  };
}

/**
 * `/workshop/mechanics` record → `MonitorRosterEntry`.
 *
 * CONFIRMED 2026-09-13: the endpoint sends `id`, `name` and `department_id`,
 * and `id` is what a monitor row's `employee_code` refers to — which is the
 * join that lets a name on the roster be matched to a name at a car.
 *
 * An entry with no id is dropped for the same reason an anonymous mechanic is:
 * it cannot be joined to anything, so it could only ever render as a row that
 * is permanently, unexplainably free.
 */
export function toMonitorRoster(records: readonly UpstreamRecord[]): MonitorRosterEntry[] {
  return records
    .map((record): MonitorRosterEntry | undefined => {
      const employeeCode = readString(record, ['id']);

      if (!employeeCode) {
        return undefined;
      }

      return {
        employeeCode,
        name: readString(record, ['name']),
        departmentId: readString(record, ['department_id']),
      };
    })
    .filter((entry): entry is MonitorRosterEntry => entry !== undefined);
}

/**
 * `/tables/departments` records → names by id.
 *
 * A map rather than a list because it has exactly one caller with exactly one
 * question: what is department 6 called. Returning the rows would make every
 * caller build this themselves.
 */
export function toDepartmentNames(records: readonly UpstreamRecord[]): ReadonlyMap<string, string> {
  const names = new Map<string, string>();

  for (const record of records) {
    const id = readString(record, ['id']);
    const name = readString(record, ['name']);

    if (id && name) {
      names.set(id, name);
    }
  }

  return names;
}

export function toMonitorServiceOrders(
  records: readonly UpstreamRecord[],
  estimates: ReadonlyMap<string, number> = new Map(),
): MonitorServiceOrder[] {
  return (
    records
      // An arrow, not a bare reference: `Array.map` passes the index as the
      // second argument, which would arrive here as `estimates` and silently
      // defeat the lookup. The compiler caught it once; the comment is so the
      // next person does not reintroduce it while tidying.
      .map((record) => toMonitorServiceOrder(record, estimates))
      .filter((order): order is MonitorServiceOrder => order !== undefined)
  );
}

/**
 * Progress, normalised to a 0–1 fraction.
 *
 * The two documentation pages disagree about the scale, so neither is trusted:
 * anything above 1 is read as a percentage and divided, anything within 0–1 is
 * taken as the fraction it already is. Both readings agree on 0 and on 1, which
 * is the only place the ambiguity could have caused a visible error — a job at
 * `1` is either 1 % or 100 %, and it is shown as complete either way. That is
 * the one case worth knowing about, and it is noted rather than hidden.
 */
function readCompletion(record: UpstreamRecord): number | undefined {
  const value = readNumber(record, FIELDS.completion);

  if (value === undefined || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return value > 1 ? Math.min(value / 100, 1) : value;
}

/** The expanded vehicle, or `undefined` when the row carries nothing usable. */
function readVehicle(record: UpstreamRecord): MonitorVehicle | undefined {
  const raw = record['vehicle'];

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return undefined;
  }

  const nested = raw as UpstreamRecord;
  const plate = readString(nested, VEHICLE_FIELDS.plate);

  const vehicle: MonitorVehicle = {
    plate: plate ? normalisePlate(plate) : undefined,
    description: readString(nested, VEHICLE_FIELDS.description),
    manufacturingYear: readNumber(nested, VEHICLE_FIELDS.manufacturingYear),
    mileage: readNumber(nested, VEHICLE_FIELDS.mileage),
    brand: readString(nested, VEHICLE_FIELDS.brand),
    model: readString(nested, VEHICLE_FIELDS.model),
    version: readString(nested, VEHICLE_FIELDS.version),
    fuel: readString(nested, VEHICLE_FIELDS.fuel),
  };

  // An object of nothing but `undefined` is noise on the wire and a falsy-ish
  // trap on the client. Absent says the same thing more clearly.
  return Object.values(vehicle).some((value) => value !== undefined) ? vehicle : undefined;
}

/**
 * The mechanics currently on the job.
 *
 * An entry without an `employee_code` is dropped: it cannot be told apart from
 * any other, so two anonymous mechanics would render as two identical rows that
 * the client cannot key or reconcile between polls.
 */
function readMechanics(record: UpstreamRecord): MonitorMechanic[] {
  return readArray(record, 'mechanics')
    .map((entry): MonitorMechanic | undefined => {
      const employeeCode = readString(entry, MECHANIC_FIELDS.employeeCode);

      if (!employeeCode) {
        return undefined;
      }

      return {
        employeeCode,
        name: readString(entry, MECHANIC_FIELDS.name),
        startedAt: readIsoDate(entry, MECHANIC_FIELDS.startedAt),
        showInMonitor: readBoolean(entry, MECHANIC_FIELDS.showInMonitor),
      };
    })
    .filter((mechanic): mechanic is MonitorMechanic => mechanic !== undefined);
}

/**
 * The jobs booked on the order.
 *
 * `completed` defaults to `false` rather than `undefined`: the board renders a
 * checkbox per line, and a tri-state there would be a distinction upstream does
 * not actually make — the field is present on every entry observed.
 */
function readInterventions(
  record: UpstreamRecord,
  estimates: ReadonlyMap<string, number>,
): MonitorIntervention[] {
  return readArray(record, 'interventions').map((entry) => {
    const name = readString(entry, INTERVENTION_FIELDS.name);

    return {
      sequenceNumber: readNumber(entry, INTERVENTION_FIELDS.sequenceNumber),
      name,
      completed: readBoolean(entry, INTERVENTION_FIELDS.completed) ?? false,
      durationRaw: readNumber(entry, INTERVENTION_FIELDS.duration),
      estimatedMinutes: name ? estimates.get(foldName(name)) : undefined,
    };
  });
}

/**
 * A nested array of records, with anything non-object skipped.
 *
 * Shared by both readers above because they had the same three lines, and
 * because upstream arrays are untrusted input: one malformed entry must cost
 * its own row and not the whole card.
 */
function readArray(record: UpstreamRecord, key: string): UpstreamRecord[] {
  const raw = record[key];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(
    (entry): entry is UpstreamRecord => typeof entry === 'object' && entry !== null,
  );
}
