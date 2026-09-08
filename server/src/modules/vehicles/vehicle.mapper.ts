/**
 * OfficeGest record → `Vehicle`.
 *
 * CONFIRMED against the tenant on 2026-09-08, by walking all 2 613 vehicles and
 * sampling detail records. Two earlier assumptions were wrong and are corrected
 * here:
 *
 *  - A list row is NOT the bare seven fields it appeared to be. Null fields are
 *    omitted from the JSON, so a single sampled record understated it: across
 *    the collection, list rows also carry `vin` (2 075), `color` (1 719),
 *    `fuel_id` (2 432), `km_counter` (2 303), `monthly_kms` (2 321) and
 *    `next_inspection_date` (1 678). Those columns were empty on screen because
 *    nothing read them, not because nothing sent them.
 *  - `year` and `last_service_at` do not exist. Not on any of the 2 613 list
 *    rows, not on any sampled detail record, under any of the candidate names
 *    this mapper used to try. They are therefore no longer published: a field
 *    that can only ever be `undefined` is a column that can only ever be a dash.
 *
 * Detail-only, so absent from a list row: `brand_name`, `model_name`,
 * `owner_name`, `updated_at`.
 */
import {
  readBoolean,
  readIsoDate,
  readNumber,
  readString,
  type UpstreamRecord,
} from '../../integrations/officegest/officegest.record-readers.js';
import { normalisePlate } from './plate.js';
import type { Vehicle } from './vehicle.model.js';

const FIELDS = {
  plate: ['plate', 'matricula', 'registration', 'license_plate'],
  description: ['description', 'descricao'],
  // Detail-only upstream; a list row resolves the brand from `brand_id`.
  brand: ['brand_name', 'brand', 'marca', 'make'],
  model: ['model_name', 'model', 'modelo'],
  ownerName: ['owner_name', 'owner', 'proprietario'],
  color: ['color', 'cor', 'colour'],
  vin: ['vin', 'chassis', 'chassi', 'numero_chassis'],
  mileage: ['km_counter', 'mileage', 'km', 'kms', 'quilometros', 'odometer'],
  monthlyMileage: ['monthly_kms', 'kms_mensais'],
  nextInspectionAt: ['next_inspection_date', 'proxima_inspecao'],
  customerId: ['owner_customer_id', 'customer_id', 'cliente_id'],
  billingCustomerId: ['billing_customer_id'],
  active: ['is_active', 'active', 'ativo'],
  registeredAt: ['created_at', 'criado_em'],
  updatedAt: ['updated_at', 'atualizado_em'],
  brandId: ['brand_id'],
  fuelId: ['fuel_id'],
  versionId: ['version_id'],
} as const;

/**
 * A vehicle with its reference ids still unresolved.
 *
 * The mapper stays pure — a record in, a record out, no network — so the join
 * against the fuel, brand and version tables happens in the service, which is
 * the layer allowed to make requests. These three fields are the seam between
 * the two, and `VehiclesService` strips them before publishing.
 */
export interface RawVehicle extends Vehicle {
  readonly brandId?: number;
  readonly fuelId?: number;
  readonly versionId?: number;
}

export function toVehicle(record: UpstreamRecord): RawVehicle | undefined {
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
    ownerName: readString(record, FIELDS.ownerName),
    color: readString(record, FIELDS.color),
    vin: readString(record, FIELDS.vin),
    mileage: readNumber(record, FIELDS.mileage),
    monthlyMileage: readNumber(record, FIELDS.monthlyMileage),
    nextInspectionAt: readIsoDate(record, FIELDS.nextInspectionAt),
    customerId: readString(record, FIELDS.customerId),
    billingCustomerId: readString(record, FIELDS.billingCustomerId),
    active: readBoolean(record, FIELDS.active),
    registeredAt: readIsoDate(record, FIELDS.registeredAt),
    updatedAt: readIsoDate(record, FIELDS.updatedAt),
    brandId: readNumber(record, FIELDS.brandId),
    fuelId: readNumber(record, FIELDS.fuelId),
    versionId: readNumber(record, FIELDS.versionId),
  };
}

export function toVehicles(records: readonly UpstreamRecord[]): RawVehicle[] {
  return records.map(toVehicle).filter((vehicle): vehicle is RawVehicle => vehicle !== undefined);
}
