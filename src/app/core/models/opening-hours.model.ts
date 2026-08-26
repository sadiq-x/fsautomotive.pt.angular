/** One row of the opening-hours table. */
export interface OpeningHoursEntry {
  readonly days: string;
  /** Human readable periods, e.g. `08:30 – 13:00`. Empty when closed. */
  readonly periods: readonly string[];
  readonly closed: boolean;
  /** `schema.org/OpeningHoursSpecification` day codes, for structured data. */
  readonly schemaDays: readonly string[];
  readonly schemaOpens?: readonly string[];
  readonly schemaCloses?: readonly string[];
}
