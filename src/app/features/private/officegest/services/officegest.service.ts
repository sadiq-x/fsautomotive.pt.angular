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
import { map, type Observable } from 'rxjs';

import { API_ROUTES } from '../../../../core/config/api.config';
import type { ApiSuccess, Paged } from '../../../../core/models/api.model';
import type { Appointment, Customer, ServiceOrder, Vehicle } from '../models/officegest.models';
import type {
  AppointmentListQuery,
  CreateAppointmentRequest,
  CustomerListQuery,
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
    });
  }

  getAppointment(id: string): Observable<Appointment> {
    return this.one<Appointment>(API_ROUTES.officegest.appointment(id));
  }

  createAppointment(request: CreateAppointmentRequest): Observable<Appointment> {
    return this.http
      .post<ApiSuccess<Appointment>>(API_ROUTES.officegest.appointments, request)
      .pipe(map((response) => response.data));
  }

  /* ------------------------------------------------------------------ */
  /* Envelope handling — written once                                    */
  /* ------------------------------------------------------------------ */

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
