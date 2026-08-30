/**
 * OfficeGest record → `Vehicle`.
 *
 * ⚠️ The candidate field names are inferred, not published — see
 * `customer.mapper.ts` for the reasoning and how to narrow them.
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
  brand: ['brand', 'marca', 'make'],
  model: ['model', 'modelo'],
  version: ['version', 'versao', 'variant'],
  year: ['year', 'ano', 'model_year'],
  fuel: ['fuel', 'combustivel', 'fuel_type'],
  vin: ['vin', 'chassis', 'chassi', 'numero_chassis'],
  mileage: ['mileage', 'km', 'kms', 'quilometros', 'odometer'],
  customerId: ['customer_id', 'cliente_id', 'customer', 'cliente'],
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
