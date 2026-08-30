/**
 * OfficeGest record → `Customer`.
 *
 * The candidate lists below are the field-name contract. OfficeGest does not
 * publish the field names inside a record, and its modules mix English and
 * Portuguese, so each field is read through the names it plausibly arrives
 * under. See `officegest.record-readers.ts` for why this beats guessing once.
 *
 * ⚠️ Once real payloads from your tenant are known, cut each list down to the
 * single correct name. Nothing else has to change.
 */
import {
  readBoolean,
  readString,
  type UpstreamRecord,
} from '../../integrations/officegest/officegest.record-readers.js';
import type { Customer } from './customer.model.js';

const FIELDS = {
  id: ['id', 'codigo', 'code', 'customer_id'],
  name: ['name', 'nome', 'designacao', 'company_name'],
  taxId: ['tax_id', 'nif', 'vat', 'vat_number', 'contribuinte'],
  email: ['email', 'e_mail'],
  phone: ['phone', 'telefone', 'tel'],
  mobile: ['mobile', 'telemovel', 'cellphone'],
  city: ['city', 'localidade', 'cidade'],
  postalCode: ['postal_code', 'codigo_postal', 'zip', 'zip_code'],
  country: ['country', 'pais'],
  active: ['active', 'activo', 'ativo', 'is_active'],
} as const;

/**
 * A record with no usable identifier cannot be addressed afterwards, so it is
 * dropped rather than published with an empty id — a list of unusable entries
 * is harder to debug than a shorter list.
 */
export function toCustomer(record: UpstreamRecord): Customer | undefined {
  const id = readString(record, FIELDS.id);
  const name = readString(record, FIELDS.name);

  if (!id) {
    return undefined;
  }

  return {
    id,
    name: name ?? '',
    taxId: readString(record, FIELDS.taxId),
    email: readString(record, FIELDS.email),
    phone: readString(record, FIELDS.phone),
    mobile: readString(record, FIELDS.mobile),
    city: readString(record, FIELDS.city),
    postalCode: readString(record, FIELDS.postalCode),
    country: readString(record, FIELDS.country),
    active: readBoolean(record, FIELDS.active),
  };
}

export function toCustomers(records: readonly UpstreamRecord[]): Customer[] {
  return records.map(toCustomer).filter((customer): customer is Customer => customer !== undefined);
}
