/**
 * The only thing in the private area that makes an HTTP call for OfficeGest
 * data.
 *
 * WHY COMPONENTS DO NOT CALL `HttpClient`
 * ---------------------------------------
 * A component that builds its own request owns a URL, a parameter vocabulary
 * and an envelope-unwrapping step — three things that then differ subtly on the
 * next page someone writes. Here they exist once: the paths come from
 * `API_ROUTES`, empty parameters are dropped in one place, and `{ data, meta }`
 * is unwrapped into the `Paged<T>` every list page consumes.
 *
 * WHAT IT IS NOT
 * --------------
 * It is not an OfficeGest client. It never sees an OfficeGest URL, header or
 * credential — it talks to *our* backend, which is the only holder of the key.
 * The layering is `Component → OfficeGestService → backend → OfficeGest`, and
 * the browser half of that chain knows nothing about the second.
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of, shareReplay, type Observable } from 'rxjs';

import { API_ROUTES } from '../../../../core/config/api.config';
import type { ApiSuccess, Paged } from '../../../../core/models/api.model';
import type {
  Appointment,
  Customer,
  Employee,
  MonitorBoard,
  ResourceCount,
  ServiceOrder,
  Vehicle,
} from '../models/officegest.models';
import type {
  AppointmentListQuery,
  CustomerListQuery,
  EmployeeListQuery,
  ServiceOrderListQuery,
  VehicleListQuery,
} from '../models/officegest.requests';

/** Values a query parameter may take before the empty ones are dropped. */
type QueryValue = string | number | boolean | undefined | null;

/**
 * Builds `HttpParams`, omitting anything empty.
 *
 * Sending `search=` would fail the backend's "2–120 characters" rule, so a
 * cleared search box has to remove the parameter rather than send a blank one.
 * Doing it here means no caller has to remember.
 */
function toParams(source: Readonly<Record<string, QueryValue>>): HttpParams {
  let params = new HttpParams();

  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  }

  return params;
}

@Injectable({ providedIn: 'root' })
export class OfficeGestService {
  private readonly http = inject(HttpClient);

  /** Built on first use by `employeesById()`, then shared. */
  private employeesCache: Observable<ReadonlyMap<string, Employee>> | null = null;

  /* ------------------------------------------------------------------ */
  /* Customers                                                           */
  /* ------------------------------------------------------------------ */

  listCustomers(query: CustomerListQuery): Observable<Paged<Customer>> {
    return this.list<Customer>(API_ROUTES.officegest.customers, {
      page: query.page,
      perPage: query.perPage,
      search: query.search,
    });
  }

  getCustomer(id: string): Observable<Customer> {
    return this.one<Customer>(API_ROUTES.officegest.customer(id));
  }

  /* ------------------------------------------------------------------ */
  /* Vehicles                                                            */
  /* ------------------------------------------------------------------ */

  listVehicles(query: VehicleListQuery): Observable<Paged<Vehicle>> {
    return this.list<Vehicle>(API_ROUTES.officegest.vehicles, {
      page: query.page,
      perPage: query.perPage,
      search: query.search,
      status: query.status,
    });
  }

  getVehicle(plate: string): Observable<Vehicle> {
    return this.one<Vehicle>(API_ROUTES.officegest.vehicle(plate));
  }

  /* ------------------------------------------------------------------ */
  /* Service orders                                                      */
  /* ------------------------------------------------------------------ */

  listServiceOrders(query: ServiceOrderListQuery): Observable<Paged<ServiceOrder>> {
    return this.list<ServiceOrder>(API_ROUTES.officegest.serviceOrders, {
      page: query.page,
      perPage: query.perPage,
      plate: query.plate,
      status: query.status,
      from: query.from,
      to: query.to,
      search: query.search,
      mechanicId: query.mechanicId,
    });
  }

  getServiceOrder(id: string): Observable<ServiceOrder> {
    return this.one<ServiceOrder>(API_ROUTES.officegest.serviceOrder(id));
  }

  /* ------------------------------------------------------------------ */
  /* Appointments                                                        */
  /* ------------------------------------------------------------------ */

  listAppointments(query: AppointmentListQuery): Observable<Paged<Appointment>> {
    return this.list<Appointment>(API_ROUTES.officegest.appointments, {
      page: query.page,
      perPage: query.perPage,
      from: query.from,
      to: query.to,
      customerId: query.customerId,
      status: query.status,
      search: query.search,
    });
  }

  getAppointment(id: string): Observable<Appointment> {
    return this.one<Appointment>(API_ROUTES.officegest.appointment(id));
  }

  /* ------------------------------------------------------------------ */
  /* The live workshop board                                             */
  /* ------------------------------------------------------------------ */

  /**
   * The whole board in one request.
   *
   * Not a `Paged<T>`: the backend returns a `MonitorBoard` carrying its own
   * `observedAt` and `activeMechanicCount`, and there is no page to ask for.
   * A board that paginated would be a board you could not read at a glance,
   * which is the only thing a board is for.
   *
   * The response is deliberately not cached or shared here. It is polled on a
   * timer by the page that shows it, and a `shareReplay` would hand the second
   * poll the first poll's answer — freezing every timer on the screen.
   */
  getWorkshopBoard(): Observable<MonitorBoard> {
    return this.one<MonitorBoard>(API_ROUTES.officegest.workshopMonitor);
  }

  /* ------------------------------------------------------------------ */
  /* Staff                                                               */
  /* ------------------------------------------------------------------ */

  /**
   * The whole roster in one request.
   *
   * `perPage` is the backend's maximum rather than a page size: the endpoint
   * returned the entire team with `hasMore: false`, and the page renders it all.
   * If it ever comes back `true`, that is the signal to give this page a pager.
   */
  listEmployees(query: EmployeeListQuery): Observable<Paged<Employee>> {
    return this.list<Employee>(API_ROUTES.officegest.employees, {
      page: query.page,
      perPage: query.perPage,
      search: query.search,
    });
  }

  /**
   * Staff names by id, fetched once per session.
   *
   * WHY IT IS CACHED HERE
   * ---------------------
   * An appointment carries an `employeeId` and nothing else, so every booking
   * on the list and every detail page needs the same tiny lookup table — five
   * people, changing perhaps twice a year. Fetching it per component would mean
   * one request per screen for data that is effectively static, and `shareReplay`
   * with `refCount: false` keeps the answer alive after the last subscriber
   * leaves, so navigating back to the diary costs nothing.
   *
   * WHY A FAILURE IS NOT AN ERROR
   * -----------------------------
   * The roster is guarded by `workers.read`, which a `USER` account does not
   * have. That is a 403, and it must not take the bookings page down with it —
   * a diary that renders without staff names is useful; one that shows an error
   * because it could not decorate a column is not. So a failure resolves to an
   * empty map and the column falls back to nothing.
   */
  employeeNames(): Observable<ReadonlyMap<string, string>> {
    return this.employeesById().pipe(
      map((byId) => new Map([...byId].map(([id, employee]) => [id, employee.name]))),
    );
  }

  /**
   * The whole roster by id, fetched once per session.
   *
   * The cache the name lookup above is built on, exposed because the mechanic
   * page needs more than the name: a mechanic's `employeeCode` is an employee
   * `id` on this tenant — CONFIRMED 2026-09-13, all five matched by id *and*
   * by name — so the contact details are one lookup away rather than a second
   * endpoint.
   *
   * A failure resolves to an empty map, for the reason given above: this is
   * guarded by `workers.read`, which the monitor's own permission does not
   * imply. Someone who may watch the board but not read the staff list gets the
   * board, the timers and no contact details — not an error page.
   */
  employeesById(): Observable<ReadonlyMap<string, Employee>> {
    this.employeesCache ??= this.listEmployees({ page: 1, perPage: 100 }).pipe(
      map((paged) => new Map(paged.items.map((employee) => [employee.id, employee]))),
      catchError(() => of(new Map<string, Employee>())),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.employeesCache;
  }

  /* ------------------------------------------------------------------ */
  /* Counts                                                              */
  /* ------------------------------------------------------------------ */

  /**
   * How many records a collection holds.
   *
   * A separate call on purpose. OfficeGest reports no total on any list
   * response, so the backend has to walk the collection to establish one —
   * several upstream requests against a metered quota. Nothing calls this on a
   * page load; it backs an explicit "count" action.
   */
  countCustomers(search?: string): Observable<ResourceCount> {
    return this.count(API_ROUTES.officegest.customersCount, { search });
  }

  /** Counts what the current filters select, not the whole collection. */
  countVehicles(
    filters: Pick<VehicleListQuery, 'search' | 'status'> = {},
  ): Observable<ResourceCount> {
    return this.count(API_ROUTES.officegest.vehiclesCount, filters);
  }

  /* ------------------------------------------------------------------ */
  /* Envelope handling — written once                                    */
  /* ------------------------------------------------------------------ */

  private count(
    url: string,
    filters: Readonly<Record<string, QueryValue>>,
  ): Observable<ResourceCount> {
    return this.http
      .get<ApiSuccess<ResourceCount>>(url, { params: toParams(filters) })
      .pipe(map((response) => response.data));
  }

  private list<T>(url: string, query: Readonly<Record<string, QueryValue>>): Observable<Paged<T>> {
    return this.http.get<ApiSuccess<readonly T[]>>(url, { params: toParams(query) }).pipe(
      map((response) => ({
        items: response.data,
        // `meta` is always present on a list response, but the type allows its
        // absence; falling back to the requested page keeps the pager honest
        // rather than resetting it to 1 behind the user's back.
        pagination: response.meta ?? {
          page: Number(query['page'] ?? 1),
          perPage: Number(query['perPage'] ?? 25),
        },
      })),
    );
  }

  private one<T>(url: string): Observable<T> {
    return this.http.get<ApiSuccess<T>>(url).pipe(map((response) => response.data));
  }
}
