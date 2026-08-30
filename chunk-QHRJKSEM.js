import {
  API_ROUTES
} from "./chunk-GUS6C3RU.js";
import {
  HttpClient,
  HttpParams,
  Injectable,
  inject,
  map,
  setClassMetadata,
  ɵɵdefineInjectable
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/officegest/services/officegest.service.ts
function toParams(source) {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(source)) {
    if (value !== void 0 && value !== null && value !== "") {
      params = params.set(key, String(value));
    }
  }
  return params;
}
var OfficeGestService = class _OfficeGestService {
  http = inject(HttpClient);
  /* ------------------------------------------------------------------ */
  /* Customers                                                           */
  /* ------------------------------------------------------------------ */
  listCustomers(query) {
    return this.list(API_ROUTES.officegest.customers, {
      page: query.page,
      perPage: query.perPage,
      search: query.search
    });
  }
  getCustomer(id) {
    return this.one(API_ROUTES.officegest.customer(id));
  }
  /* ------------------------------------------------------------------ */
  /* Vehicles                                                            */
  /* ------------------------------------------------------------------ */
  listVehicles(query) {
    return this.list(API_ROUTES.officegest.vehicles, {
      page: query.page,
      perPage: query.perPage,
      search: query.search
    });
  }
  getVehicle(plate) {
    return this.one(API_ROUTES.officegest.vehicle(plate));
  }
  /* ------------------------------------------------------------------ */
  /* Service orders                                                      */
  /* ------------------------------------------------------------------ */
  listServiceOrders(query) {
    return this.list(API_ROUTES.officegest.serviceOrders, {
      page: query.page,
      perPage: query.perPage,
      plate: query.plate,
      status: query.status
    });
  }
  getServiceOrder(id) {
    return this.one(API_ROUTES.officegest.serviceOrder(id));
  }
  /* ------------------------------------------------------------------ */
  /* Appointments                                                        */
  /* ------------------------------------------------------------------ */
  listAppointments(query) {
    return this.list(API_ROUTES.officegest.appointments, {
      page: query.page,
      perPage: query.perPage,
      from: query.from,
      to: query.to,
      customerId: query.customerId
    });
  }
  getAppointment(id) {
    return this.one(API_ROUTES.officegest.appointment(id));
  }
  createAppointment(request) {
    return this.http.post(API_ROUTES.officegest.appointments, request).pipe(map((response) => response.data));
  }
  /* ------------------------------------------------------------------ */
  /* Envelope handling — written once                                    */
  /* ------------------------------------------------------------------ */
  list(url, query) {
    return this.http.get(url, { params: toParams(query) }).pipe(map((response) => ({
      items: response.data,
      // `meta` is always present on a list response, but the type allows its
      // absence; falling back to the requested page keeps the pager honest
      // rather than resetting it to 1 behind the user's back.
      pagination: response.meta ?? {
        page: Number(query["page"] ?? 1),
        perPage: Number(query["perPage"] ?? 25)
      }
    })));
  }
  one(url) {
    return this.http.get(url).pipe(map((response) => response.data));
  }
  static \u0275fac = function OfficeGestService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _OfficeGestService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _OfficeGestService, factory: _OfficeGestService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(OfficeGestService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();

export {
  OfficeGestService
};
//# sourceMappingURL=chunk-QHRJKSEM.js.map
