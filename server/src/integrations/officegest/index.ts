/**
 * Composition root for the OfficeGest integration.
 *
 * One client instance is shared by every resource, so the token obtained by one
 * request is reused by all of them — a per-resource client would log in four
 * times and hold four sessions. The factory returns the resources rather than
 * the client so services depend on the narrow thing they use.
 */
import { config } from '../../config/index.js';
import { OfficeGestClient, type OfficeGestClientDeps } from './officegest.client.js';
import { AppointmentsResource } from './resources/appointments.resource.js';
import { CustomersResource } from './resources/customers.resource.js';
import { ServiceOrdersResource } from './resources/service-orders.resource.js';
import { VehiclesResource } from './resources/vehicles.resource.js';

export interface OfficeGestIntegration {
  readonly client: OfficeGestClient;
  readonly customers: CustomersResource;
  readonly vehicles: VehiclesResource;
  readonly serviceOrders: ServiceOrdersResource;
  readonly appointments: AppointmentsResource;
}

export function createOfficeGestIntegration(
  deps: OfficeGestClientDeps = {},
): OfficeGestIntegration {
  const client = new OfficeGestClient(config.officegest, deps);

  return {
    client,
    customers: new CustomersResource(client),
    vehicles: new VehiclesResource(client),
    serviceOrders: new ServiceOrdersResource(client),
    appointments: new AppointmentsResource(client),
  };
}

export { OfficeGestClient } from './officegest.client.js';
export type {
  OfficeGestClientDeps,
  OfficeGestRequestOptions,
  QueryValue,
} from './officegest.client.js';
export * from './officegest.errors.js';
export { isClientDisconnect, toAppError } from './officegest.error-mapper.js';
export { AppointmentsResource } from './resources/appointments.resource.js';
export { CustomersResource } from './resources/customers.resource.js';
export { ServiceOrdersResource } from './resources/service-orders.resource.js';
export { VehiclesResource } from './resources/vehicles.resource.js';
export type { OfficeGestListResult } from './officegest.types.js';
export type { UpstreamRecord } from './officegest.record-readers.js';
