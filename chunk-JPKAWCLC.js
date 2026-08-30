import {
  PRIVATE_ROUTES
} from "./chunk-GUS6C3RU.js";

// src/app/features/private/layout/private-nav.data.ts
var PRIVATE_NAV = [
  {
    label: "Painel",
    path: PRIVATE_ROUTES.dashboard,
    icon: "dashboard",
    exact: true,
    description: "Resumo da atividade da oficina."
  },
  {
    label: "Clientes",
    path: PRIVATE_ROUTES.customers,
    icon: "users",
    permission: "officegest.customers.read",
    description: "Consultar a base de clientes do OfficeGest."
  },
  {
    label: "Ve\xEDculos",
    path: PRIVATE_ROUTES.vehicles,
    icon: "car",
    permission: "officegest.vehicles.read",
    description: "Procurar por matr\xEDcula, marca ou modelo."
  },
  {
    label: "Folhas de obra",
    path: PRIVATE_ROUTES.serviceOrders,
    icon: "clipboard-list",
    permission: "officegest.service-orders.read",
    description: "Acompanhar as interven\xE7\xF5es em curso e conclu\xEDdas."
  },
  {
    label: "Marca\xE7\xF5es",
    path: PRIVATE_ROUTES.appointments,
    icon: "calendar",
    permission: "officegest.appointments.read",
    description: "Ver e criar marca\xE7\xF5es de oficina."
  }
];

export {
  PRIVATE_NAV
};
//# sourceMappingURL=chunk-JPKAWCLC.js.map
