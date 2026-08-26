/** A category of vehicle the workshop accepts. */
export interface VehicleType {
  readonly id: string;
  readonly label: string;
  readonly image: string;
  readonly description: string;
}
