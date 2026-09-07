/**
 * OfficeGest record → `Employee`.
 *
 * CONFIRMED against the tenant on 2026-09-07 by inspecting real payloads, so
 * each list holds the name that is actually sent, with the historical variants
 * kept only as fallbacks.
 *
 * Deliberately NOT published: `permissions_group` and `warehouses_access` are
 * authorisation internals, and the postal address is personal data the roster
 * does not need.
 */
import {
  readBoolean,
  readIsoDate,
  readString,
  type UpstreamRecord,
} from '../../integrations/officegest/officegest.record-readers.js';
import type { Employee } from './employee.model.js';

const FIELDS = {
  id: ['id', 'employee_id', 'codigo', 'code'],
  name: ['name', 'nome'],
  email: ['email', 'e_mail'],
  // One column in the UI, so the mobile wins and the landline backs it up.
  phone: ['mobile_phone', 'phone', 'telemovel', 'telefone'],
  login: ['login', 'username'],
  onWorkshopAgenda: ['show_on_workshop_agenda'],
  since: ['created_at', 'admission_date', 'data_admissao'],
  active: ['active', 'activo', 'ativo', 'is_active'],
} as const;

/** A record with no id cannot be keyed in a list, so it is dropped. */
export function toEmployee(record: UpstreamRecord): Employee | undefined {
  const id = readString(record, FIELDS.id);

  if (!id) {
    return undefined;
  }

  return {
    id,
    name: readString(record, FIELDS.name) ?? '',
    email: readString(record, FIELDS.email),
    phone: readString(record, FIELDS.phone),
    login: readString(record, FIELDS.login),
    onWorkshopAgenda: readBoolean(record, FIELDS.onWorkshopAgenda),
    since: readIsoDate(record, FIELDS.since),
    active: readBoolean(record, FIELDS.active),
  };
}

export function toEmployees(records: readonly UpstreamRecord[]): Employee[] {
  return records.map(toEmployee).filter((e): e is Employee => e !== undefined);
}
