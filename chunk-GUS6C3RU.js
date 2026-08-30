import {
  InjectionToken
} from "./chunk-RUFDRP5X.js";

// src/app/core/config/private-routes.config.ts
var PRIVATE_BASE = "/gestao";
var PRIVATE_ROUTES = {
  base: PRIVATE_BASE,
  login: `${PRIVATE_BASE}/entrar`,
  dashboard: `${PRIVATE_BASE}/painel`,
  customers: `${PRIVATE_BASE}/clientes`,
  customer: (id) => `${PRIVATE_BASE}/clientes/${encodeURIComponent(id)}`,
  vehicles: `${PRIVATE_BASE}/veiculos`,
  vehicle: (plate) => `${PRIVATE_BASE}/veiculos/${encodeURIComponent(plate)}`,
  serviceOrders: `${PRIVATE_BASE}/folhas-de-obra`,
  serviceOrder: (id) => `${PRIVATE_BASE}/folhas-de-obra/${encodeURIComponent(id)}`,
  appointments: `${PRIVATE_BASE}/marcacoes`,
  appointment: (id) => `${PRIVATE_BASE}/marcacoes/${encodeURIComponent(id)}`,
  newAppointment: `${PRIVATE_BASE}/marcacoes/nova`
};

// src/app/core/config/api.config.ts
var API_BASE_URL_VALUE = true ? "".trim().replace(/\/+$/, "") : "";
var API_BASE_URL = new InjectionToken("API_BASE_URL", {
  providedIn: "root",
  factory: () => API_BASE_URL_VALUE
});
var API_ROUTES = {
  officegest: {
    customers: "/api/officegest/customers",
    customer: (id) => `/api/officegest/customers/${encodeURIComponent(id)}`,
    vehicles: "/api/officegest/vehicles",
    vehicle: (plate) => `/api/officegest/vehicles/${encodeURIComponent(plate)}`,
    serviceOrders: "/api/officegest/service-orders",
    serviceOrder: (id) => `/api/officegest/service-orders/${encodeURIComponent(id)}`,
    appointments: "/api/officegest/appointments",
    appointment: (id) => `/api/officegest/appointments/${encodeURIComponent(id)}`
  }
};

export {
  API_BASE_URL,
  API_ROUTES,
  PRIVATE_ROUTES
};
//# sourceMappingURL=chunk-GUS6C3RU.js.map
