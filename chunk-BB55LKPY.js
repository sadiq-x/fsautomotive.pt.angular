import {
  NotificationService
} from "./chunk-BWF5CPVO.js";
import {
  AuthService
} from "./chunk-DWZ5PAW5.js";
import {
  PRIVATE_ROUTES
} from "./chunk-GUS6C3RU.js";
import {
  Router,
  inject
} from "./chunk-RUFDRP5X.js";

// src/app/core/guards/auth.guard.ts
var authGuard = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.restore();
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree([PRIVATE_ROUTES.login], {
    queryParams: { redirect: state.url }
  });
};
var guestGuard = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.restore();
  return auth.isAuthenticated() ? router.createUrlTree([PRIVATE_ROUTES.dashboard]) : true;
};
function permissionGuard(...permissions) {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const notifications = inject(NotificationService);
    await auth.restore();
    if (!auth.isAuthenticated()) {
      return router.createUrlTree([PRIVATE_ROUTES.login]);
    }
    if (auth.hasAnyPermission(permissions)) {
      return true;
    }
    notifications.warning("N\xE3o tem permiss\xE3o para aceder a essa \xE1rea.");
    return router.createUrlTree([PRIVATE_ROUTES.dashboard]);
  };
}

// src/app/features/private/private.routes.ts
function privateMeta(title, path) {
  return {
    title,
    description: "\xC1rea reservada \xE0 equipa da FS Automotive.",
    path,
    noIndex: true
  };
}
var privateRoutes = [
  {
    path: "entrar",
    canActivate: [guestGuard],
    loadComponent: () => import("./chunk-IURNHY7Z.js").then((m) => m.Login),
    data: { meta: privateMeta("Entrar", "/gestao/entrar") }
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () => import("./chunk-6NQGTOEV.js").then((m) => m.PrivateShell),
    children: [
      { path: "", pathMatch: "full", redirectTo: "painel" },
      {
        path: "painel",
        loadComponent: () => import("./chunk-B4BAVSRV.js").then((m) => m.Dashboard),
        data: { meta: privateMeta("Painel", "/gestao/painel") }
      },
      {
        path: "clientes",
        canActivate: [permissionGuard("officegest.customers.read")],
        loadComponent: () => import("./chunk-TRANKHSQ.js").then((m) => m.Customers),
        data: { meta: privateMeta("Clientes", "/gestao/clientes") }
      },
      {
        path: "clientes/:customerId",
        canActivate: [permissionGuard("officegest.customers.read")],
        loadComponent: () => import("./chunk-YSWQP4BF.js").then((m) => m.CustomerDetail),
        data: { meta: privateMeta("Cliente", "/gestao/clientes") }
      },
      {
        path: "veiculos",
        canActivate: [permissionGuard("officegest.vehicles.read")],
        loadComponent: () => import("./chunk-VLU2SMPI.js").then((m) => m.Vehicles),
        data: { meta: privateMeta("Ve\xEDculos", "/gestao/veiculos") }
      },
      {
        path: "veiculos/:plate",
        canActivate: [permissionGuard("officegest.vehicles.read")],
        loadComponent: () => import("./chunk-XQ67F2Q7.js").then((m) => m.VehicleDetail),
        data: { meta: privateMeta("Ve\xEDculo", "/gestao/veiculos") }
      },
      {
        path: "folhas-de-obra",
        canActivate: [permissionGuard("officegest.service-orders.read")],
        loadComponent: () => import("./chunk-PQPIIX4W.js").then((m) => m.ServiceOrders),
        data: { meta: privateMeta("Folhas de obra", "/gestao/folhas-de-obra") }
      },
      {
        path: "folhas-de-obra/:serviceOrderId",
        canActivate: [permissionGuard("officegest.service-orders.read")],
        loadComponent: () => import("./chunk-ZRRSHVB6.js").then((m) => m.ServiceOrderDetail),
        data: { meta: privateMeta("Folha de obra", "/gestao/folhas-de-obra") }
      },
      // `nova` is declared before `:appointmentId`, or the router would treat
      // it as an id and try to load a booking called "nova".
      {
        path: "marcacoes/nova",
        canActivate: [permissionGuard("officegest.appointments.write")],
        loadComponent: () => import("./chunk-YFOUE7CI.js").then((m) => m.AppointmentForm),
        data: { meta: privateMeta("Nova marca\xE7\xE3o", "/gestao/marcacoes/nova") }
      },
      {
        path: "marcacoes",
        canActivate: [permissionGuard("officegest.appointments.read")],
        loadComponent: () => import("./chunk-SK4GGHUI.js").then((m) => m.Appointments),
        data: { meta: privateMeta("Marca\xE7\xF5es", "/gestao/marcacoes") }
      },
      {
        path: "marcacoes/:appointmentId",
        canActivate: [permissionGuard("officegest.appointments.read")],
        loadComponent: () => import("./chunk-IPZLALNL.js").then((m) => m.AppointmentDetail),
        data: { meta: privateMeta("Marca\xE7\xE3o", "/gestao/marcacoes") }
      },
      { path: "**", redirectTo: "painel" }
    ]
  }
];
export {
  privateRoutes
};
//# sourceMappingURL=chunk-BB55LKPY.js.map
