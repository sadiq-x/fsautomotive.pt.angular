/**
 * How a vehicle's fields are written for a person.
 *
 * Small, but shared: the list and the detail page describe the same car, and
 * two copies of "brand, then model, then fall back to the description" is how
 * a row and its own page come to disagree.
 */
import type { Vehicle } from '../../models';
import { orNull } from '../../utils/format';

/** What the state filter offers. `''` means "do not filter". */
export const VEHICLE_STATUS_OPTIONS: readonly {
  readonly value: string;
  readonly label: string;
}[] = [
  { value: '', label: 'Todos os estados' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
];

/**
 * The car in one line: what is known, in the order a person reads it.
 *
 * The description is a fallback rather than an addition — it is the tenant's
 * own text, "RENAULT CLIO 1.5 DCI", so printing it beside a resolved brand and
 * model would say everything twice.
 *
 * Which one wins depends on how much was resolved, and that is the whole point
 * of this function. A list row knows the brand but not the model, and "Renault"
 * alone tells a reader less than the description does; a detail record knows
 * both, and "Renault Clio 1.5 dCi" reads better than the upper-case original.
 * So the named form is preferred only once it is at least a brand and a model.
 */
export function describeVehicle(vehicle: Vehicle): string | null {
  const named = orNull([vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(' '));
  const isComplete = vehicle.brand !== undefined && vehicle.model !== undefined;

  return (isComplete ? named : null) ?? orNull(vehicle.description) ?? named;
}

/** `1500` → `1 500 km/mês`, or nothing when the tenant recorded no estimate. */
export function formatMonthlyMileage(value: number | undefined): string | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? `${value.toLocaleString('pt-PT')} km/mês`
    : null;
}
