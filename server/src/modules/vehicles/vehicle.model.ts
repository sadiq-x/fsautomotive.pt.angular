/** A workshop vehicle, as this API publishes it. */
export interface Vehicle {
  /** The registration plate, normalised — OfficeGest's own key for a vehicle. */
  readonly plate: string;
  /**
   * The tenant's own one-line description of the car.
   *
   * Published because it is the only free-text field a list row carries:
   * `brand_name` and `model_name` exist upstream but only on the detail record,
   * so without this a row would be a bare plate.
   */
  readonly description?: string;
  /** Resolved from `brand_id` against the brands table. */
  readonly brand?: string;
  /** Detail records only — there is no model name on a list row. */
  readonly model?: string;
  /** Resolved from `version_id`, one row at a time. Detail records only. */
  readonly version?: string;
  /** Resolved from `fuel_id` against the fuels table. */
  readonly fuel?: string;
  readonly color?: string;
  /** Chassis number. Published because a workshop identifies a car by it. */
  readonly vin?: string;
  /** The odometer reading OfficeGest holds, in kilometres. */
  readonly mileage?: number;
  /** The tenant's estimate of kilometres driven per month. */
  readonly monthlyMileage?: number;
  /** When the car is next due for inspection. */
  readonly nextInspectionAt?: string;
  /** Links back to `/api/officegest/customers/:customerId`. */
  readonly customerId?: string;
  /** The owner's name. Detail records only. */
  readonly ownerName?: string;
  /** Whoever is invoiced, when that is not the owner. */
  readonly billingCustomerId?: string;
  /** Whether the workshop still considers the car on its books. */
  readonly active?: boolean;
  /** When the record was created in OfficeGest — the list's sort key. */
  readonly registeredAt?: string;
  readonly updatedAt?: string;
}
