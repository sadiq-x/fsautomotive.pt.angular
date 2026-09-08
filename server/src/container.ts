/**
 * The composition root: the one place that decides what is wired to what.
 *
 * WHY NOT LET EACH MODULE CONSTRUCT ITS OWN DEPENDENCIES
 * ------------------------------------------------------
 * Because then every module would build its own OfficeGest client — four
 * clients, four login round trips, four sessions where one is needed — and
 * because a service that reaches out for its collaborators cannot be handed a
 * fake in a test. Constructor injection everywhere else, assembled once here,
 * gives both: a single shared client, and services that take exactly what they
 * use.
 *
 * WHY NOT A DI FRAMEWORK
 * ----------------------
 * Four services and one client. A container library would add a dependency, a
 * decorator vocabulary and a class of runtime resolution errors, to replace
 * fifteen lines whose wiring the compiler already checks.
 */
import { config } from './config/index.js';
import {
  createOfficeGestIntegration,
  type OfficeGestClientDeps,
  type OfficeGestIntegration,
} from './integrations/officegest/index.js';
import { AppointmentsService } from './modules/appointments/appointments.service.js';
import { AuthService } from './modules/auth/auth.service.js';
import { CustomersService } from './modules/customers/customers.service.js';
import { EmployeesService } from './modules/employees/employees.service.js';
import { ServiceOrdersService } from './modules/service-orders/service-orders.service.js';
import { VehicleCatalogue } from './modules/vehicles/vehicle-catalogue.js';
import { VehiclesService } from './modules/vehicles/vehicles.service.js';

export interface Container {
  readonly officegest: OfficeGestIntegration;
  /**
   * Sign-in. Present even when no accounts are configured — it then reports
   * `enabled: false`, which is what `routes/index.ts` reads to decide whether
   * to mount `/api/auth` at all. An absent service would push that same check
   * into every caller as a null test.
   */
  readonly auth: AuthService;
  readonly customers: CustomersService;
  readonly employees: EmployeesService;
  readonly vehicles: VehiclesService;
  readonly serviceOrders: ServiceOrdersService;
  readonly appointments: AppointmentsService;
  /** Releases upstream resources. Called on shutdown. */
  shutdown(): Promise<void>;
}

/**
 * @param deps Overrides for the OfficeGest transport. Tests pass a fake `fetch`
 * here and get a fully wired application with no network access.
 */
export function createContainer(deps: OfficeGestClientDeps = {}): Container {
  const officegest = createOfficeGestIntegration(deps);
  const auth = new AuthService(config.auth);

  return {
    officegest,
    auth,
    customers: new CustomersService(officegest.customers),
    employees: new EmployeesService(officegest.employees),
    vehicles: new VehiclesService(
      officegest.vehicles,
      new VehicleCatalogue(officegest.vehicleCatalogue),
    ),
    serviceOrders: new ServiceOrdersService(officegest.serviceOrders),
    appointments: new AppointmentsService(officegest.appointments),
    shutdown: async () => {
      // Both hold interval timers. Disposing them is what lets a test build
      // dozens of applications without leaking a handle each time, and what
      // lets the process exit promptly on SIGTERM.
      auth.dispose();
      await officegest.client.dispose();
    },
  };
}
