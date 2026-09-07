/**
 * OfficeGest record → `Vehicle`.
 *
 * CONFIRMED against the tenant on 2026-09-07. Four of these were wrong and read
 * as `undefined` on every record: mileage is `km_counter`, the owner is
 * `owner_customer_id`, and the brand and model arrive as `brand_name` /
 * `model_name` — and only on the detail endpoint, which is why `description` is
 * now mapped too.
 *
 * Still genuinely absent upstream, so still `undefined`: `year`, `fuel` (only a
 * numeric `fuel_id`), `version` (only `version_id`) and `lastServiceAt`. Also
 * available and not yet published: `color`, `monthly_kms`,
 * `next_inspection_date`.
 */
import {
  readNumber,
  readIsoDate,
  readString,
  type UpstreamRecord,
} from '../../integrations/officegest/officegest.record-readers.js';
import { normalisePlate } from './plate.js';
import type { Vehicle } from './vehicle.model.js';

const FIELDS = {
  plate: ['plate', 'matricula', 'registration', 'license_plate'],
  description: ['description', 'descricao'],
  // Detail-only upstream; a list row falls back to `description`.
  brand: ['brand_name', 'brand', 'marca', 'make'],
  model: ['model_name', 'model', 'modelo'],
  version: ['version', 'versao', 'variant'],
  year: ['year', 'ano', 'model_year'],
  fuel: ['fuel', 'combustivel', 'fuel_type'],
  vin: ['vin', 'chassis', 'chassi', 'numero_chassis'],
  mileage: ['km_counter', 'mileage', 'km', 'kms', 'quilometros', 'odometer'],
  customerId: ['owner_customer_id', 'customer_id', 'billing_customer_id', 'cliente_id'],
  lastServiceAt: ['last_service_at', 'ultima_intervencao', 'last_intervention'],
} as const;

export function toVehicle(record: UpstreamRecord): Vehicle | undefined {
  const rawPlate = readString(record, FIELDS.plate);

  // Without a plate the vehicle cannot be fetched again, so it is dropped
  // rather than published as an unusable entry.
  if (!rawPlate) {
    return undefined;
  }

  return {
    plate: normalisePlate(rawPlate),
    description: readString(record, FIELDS.description),
    brand: readString(record, FIELDS.brand),
    model: readString(record, FIELDS.model),
    version: readString(record, FIELDS.version),
    year: readNumber(record, FIELDS.year),
    fuel: readString(record, FIELDS.fuel),
    vin: readString(record, FIELDS.vin),
    mileage: readNumber(record, FIELDS.mileage),
    customerId: readString(record, FIELDS.customerId),
    lastServiceAt: readIsoDate(record, FIELDS.lastServiceAt),
  };
}

export function toVehicles(records: readonly UpstreamRecord[]): Vehicle[] {
  return records.map(toVehicle).filter((vehicle): vehicle is Vehicle => vehicle !== undefined);
}
