import {
  CookieNotice,
  Lightbox,
  MapEmbed,
  OpeningHours,
  SocialLinks
} from "./chunk-AL2QOPM3.js";
import {
  UiButton
} from "./chunk-NGHYTC22.js";
import {
  AnalyticsService,
  SeoService,
  StructuredDataService
} from "./chunk-PWBEWDIV.js";
import {
  NotificationService
} from "./chunk-BWF5CPVO.js";
import {
  NAV_LINKS
} from "./chunk-H4LGSLFV.js";
import {
  SITE
} from "./chunk-UVBD33FH.js";
import {
  toSignal
} from "./chunk-TZW5CK7K.js";
import {
  provideAuth
} from "./chunk-ZQIDUDRV.js";
import {
  AuthService,
  EXPECTS_UNAUTHORIZED,
  apiInterceptor
} from "./chunk-DWZ5PAW5.js";
import {
  ApiError
} from "./chunk-4AV4IBWC.js";
import {
  PRIVATE_ROUTES
} from "./chunk-GUS6C3RU.js";
import {
  Icon
} from "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  HttpErrorResponse,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  bootstrapApplication,
  catchError,
  computed,
  effect,
  filter,
  inject,
  map,
  provideBrowserGlobalErrorListeners,
  provideHttpClient,
  provideRouter,
  provideZonelessChangeDetection,
  setClassMetadata,
  signal,
  startWith,
  throwError,
  withComponentInputBinding,
  withInMemoryScrolling,
  withInterceptors,
  withViewTransitions,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresolveWindow,
  ɵɵsanitizeUrl,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-RUFDRP5X.js";

// src/app/app.routes.ts
var routes = [
  {
    path: "",
    pathMatch: "full",
    loadComponent: () => import("./chunk-YTKXLBY3.js").then((m) => m.Home),
    data: {
      meta: {
        title: "Oficina autom\xF3vel multimarca em Vialonga",
        description: "FS Automotive \u2014 oficina multimarca em Vialonga. Mec\xE2nica, diagn\xF3stico computorizado, pintura, pneus e pr\xE9-inspe\xE7\xE3o com atendimento personalizado.",
        path: "/",
        image: "images/workshop/oficina-1.jpg"
      }
    }
  },
  {
    path: "sobre-nos",
    loadComponent: () => import("./chunk-BM5QIKB4.js").then((m) => m.About),
    data: {
      meta: {
        title: "Sobre N\xF3s",
        description: "Conhe\xE7a a FS Automotive: uma equipa experiente liderada por Miguel Faria, com tecnologia de ponta, sala de espera e parque para clientes em Vialonga.",
        path: "/sobre-nos",
        image: "images/workshop/oficina-4.jpg"
      }
    }
  },
  {
    path: "servicos",
    loadComponent: () => import("./chunk-QBPWHLSR.js").then((m) => m.Services),
    data: {
      meta: {
        title: "Servi\xE7os",
        description: "Servi\xE7os r\xE1pidos, mec\xE2nica especializada, eletricidade e eletr\xF3nica, diagn\xF3stico computorizado, pneus, escapes, pintura e pr\xE9-inspe\xE7\xE3o.",
        path: "/servicos",
        image: "images/workshop/oficina-3.jpg"
      }
    }
  },
  {
    path: "contactos",
    loadComponent: () => import("./chunk-XSE5MKRQ.js").then((m) => m.Contact),
    data: {
      meta: {
        title: "Contactos",
        description: "Rua do Olival Santo 16b, 2625-585 Vialonga. Telefone (+351) 933 678 865 \xB7 fsautomotive.servicos@gmail.com. Veja o hor\xE1rio e como chegar.",
        path: "/contactos"
      }
    }
  },
  /**
   * The private management area.
   *
   * Lazily loaded as a whole: a visitor to the public site never downloads the
   * shell, the OfficeGest service or any of its pages. Its own guards and
   * routes live in `features/private/private.routes.ts`.
   */
  {
    path: "gestao",
    loadChildren: () => import("./chunk-BB55LKPY.js").then((m) => m.privateRoutes)
  },
  /* Legacy paths from the previous static site, kept so old links survive. */
  { path: "home", redirectTo: "", pathMatch: "full" },
  { path: "sobrenos", redirectTo: "sobre-nos", pathMatch: "full" },
  { path: "contacts", redirectTo: "contactos", pathMatch: "full" },
  {
    path: "**",
    loadComponent: () => import("./chunk-2J4EKBBE.js").then((m) => m.NotFound),
    data: {
      meta: {
        title: "P\xE1gina n\xE3o encontrada",
        description: "A p\xE1gina que procura n\xE3o existe ou foi movida.",
        path: "/404"
      }
    }
  }
];

// src/app/core/interceptors/error.interceptor.ts
var MESSAGES = {
  0: "N\xE3o foi poss\xEDvel contactar o servidor. Verifique a sua liga\xE7\xE3o.",
  400: "O pedido n\xE3o \xE9 v\xE1lido.",
  403: "N\xE3o tem permiss\xE3o para efetuar esta a\xE7\xE3o.",
  404: "N\xE3o encontr\xE1mos o registo pedido.",
  408: "O pedido demorou demasiado tempo.",
  413: "O conte\xFAdo enviado \xE9 demasiado grande.",
  429: "Demasiados pedidos. Aguarde um momento e tente novamente.",
  500: "Ocorreu um erro no servidor. Tente novamente dentro de momentos.",
  502: "O servi\xE7o OfficeGest est\xE1 indispon\xEDvel de momento.",
  503: "O servi\xE7o est\xE1 temporariamente indispon\xEDvel.",
  504: "O OfficeGest demorou demasiado tempo a responder."
};
var FALLBACK_MESSAGE = "Ocorreu um erro inesperado.";
var ANNOUNCED_STATUSES = /* @__PURE__ */ new Set([0, 429, 500, 502, 503, 504]);
function asFailure(body) {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const candidate = body;
  return candidate.success === false && typeof candidate.error?.message === "string" ? candidate : null;
}
function toApiError(response) {
  const failure = asFailure(response.error);
  const status = response.status;
  if (failure) {
    const message = status < 500 ? failure.error.message : MESSAGES[status] ?? failure.error.message;
    return new ApiError(status, failure.error.code, message, failure.error.details, failure.requestId);
  }
  return new ApiError(status, `HTTP_${status}`, MESSAGES[status] ?? FALLBACK_MESSAGE);
}
var errorInterceptor = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notifications = inject(NotificationService);
  return next(request).pipe(catchError((response) => {
    if (!(response instanceof HttpErrorResponse)) {
      return throwError(() => response);
    }
    const error = toApiError(response);
    if (error.status === 401 && !request.context.get(EXPECTS_UNAUTHORIZED)) {
      if (auth.isAuthenticated()) {
        notifications.warning("A sua sess\xE3o terminou. Inicie sess\xE3o novamente.");
      }
      auth.clear();
      void router.navigate([PRIVATE_ROUTES.login], {
        queryParams: { redirect: router.url }
      });
    }
    if (ANNOUNCED_STATUSES.has(error.status)) {
      notifications.error(error.message, error.requestId ? `Refer\xEAncia: ${error.requestId}` : void 0);
    }
    return throwError(() => error);
  }));
};

// src/app/app.config.ts
var appConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // Order matters: `apiInterceptor` rewrites the URL and attaches
    // credentials on the way out, `errorInterceptor` normalises whatever comes
    // back. The error handler is listed last so it wraps the outgoing one and
    // sees every failure, including those raised by the rewrite.
    provideHttpClient(withInterceptors([apiInterceptor, errorInterceptor])),
    // Picks the real authentication gateway, or the development stub when
    // `DEV_AUTH_STUB=true` — which the production build refuses outright.
    provideAuth(),
    provideRouter(
      routes,
      // Scroll to the top on navigation, but honour #fragment links and
      // restore the previous offset when going back.
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
        anchorScrolling: "enabled"
      }),
      withComponentInputBinding(),
      withViewTransitions({ skipInitialTransition: true })
    )
  ]
};

// src/app/layout/footer/footer.ts
var _forTrack0 = ($index, $item) => $item.path;
function Footer_For_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li")(1, "a", 27);
    \u0275\u0275element(2, "app-icon", 28);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const link_r1 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("routerLink", link_r1.path);
    \u0275\u0275advance();
    \u0275\u0275property("size", 13);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", link_r1.label, " ");
  }
}
var Footer = class _Footer {
  site = SITE;
  links = NAV_LINKS;
  currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  static \u0275fac = function Footer_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Footer)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Footer, selectors: [["app-footer"]], hostAttrs: [1, "block"], decls: 51, vars: 19, consts: [[1, "bg-ink-950", "pb-safe-nav", "text-bone-300"], [1, "container-page", "py-16", "lg:py-20"], [1, "grid", "gap-12", "lg:grid-cols-12", "lg:gap-10"], [1, "lg:col-span-4"], ["alt", "FS Automotive", "width", "661", "height", "182", "loading", "lazy", 1, "h-11", "w-auto", 3, "src"], [1, "mt-6", "max-w-sm", "text-sm", "leading-relaxed", "text-bone-400"], ["tone", "dark", 1, "mt-7"], ["aria-label", "Mapa do site", 1, "lg:col-span-2"], [1, "text-xs", "font-bold", "tracking-[0.16em]", "text-white", "uppercase"], [1, "mt-5", "space-y-3"], [1, "lg:col-span-3"], [1, "mt-5", "space-y-4", "text-sm"], [1, "group", "flex", "items-start", "gap-3", "py-1", "text-bone-400", "transition-colors", "duration-200", "hover:text-white", "touch:py-2", 3, "href"], ["name", "phone", 1, "mt-0.5", "text-brand-500", 3, "size"], [1, "font-semibold", "tabular-nums"], [1, "group", "flex", "items-start", "gap-3", "py-1", "break-all", "text-bone-400", "transition-colors", "duration-200", "hover:text-white", "touch:py-2", 3, "href"], ["name", "mail", 1, "mt-0.5", "shrink-0", "text-brand-500", 3, "size"], ["target", "_blank", "rel", "noopener noreferrer", 1, "group", "flex", "items-start", "gap-3", "py-1", "text-bone-400", "transition-colors", "duration-200", "hover:text-white", "touch:py-2", 3, "href"], ["name", "map-pin", 1, "mt-0.5", "shrink-0", "text-brand-500", 3, "size"], [1, "mt-9", "text-xs", "font-bold", "tracking-[0.16em]", "text-white", "uppercase"], ["tone", "dark", 1, "mt-2"], ["frameClass", "aspect-[4/3]", 1, "mt-5"], ["target", "_blank", "rel", "noopener noreferrer", 1, "mt-4", "inline-flex", "items-center", "gap-2", "text-sm", "font-semibold", "text-bone-300", "transition-colors", "duration-200", "hover:text-brand-500", 3, "href"], ["name", "arrow-up-right", 3, "size"], [1, "border-t", "border-white/8"], [1, "container-page", "flex", "flex-col", "items-center", "justify-between", "gap-3", "py-6", "text-center", "sm:flex-row", "sm:text-left"], [1, "text-bone-500", "text-xs"], [1, "group", "inline-flex", "items-center", "gap-1.5", "py-1", "text-sm", "text-bone-400", "transition-colors", "duration-200", "hover:text-brand-500", "touch:py-2", 3, "routerLink"], ["name", "chevron-right", 1, "text-brand-600", "transition-transform", "duration-200", "group-hover:translate-x-0.5", 3, "size"]], template: function Footer_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "footer", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3);
      \u0275\u0275element(4, "img", 4);
      \u0275\u0275elementStart(5, "p", 5);
      \u0275\u0275text(6);
      \u0275\u0275elementEnd();
      \u0275\u0275element(7, "app-social-links", 6);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(8, "nav", 7)(9, "h2", 8);
      \u0275\u0275text(10, "Navega\xE7\xE3o");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(11, "ul", 9);
      \u0275\u0275repeaterCreate(12, Footer_For_13_Template, 4, 3, "li", null, _forTrack0);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(14, "div", 10)(15, "h2", 8);
      \u0275\u0275text(16, "Contactos");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(17, "ul", 11)(18, "li")(19, "a", 12);
      \u0275\u0275element(20, "app-icon", 13);
      \u0275\u0275elementStart(21, "span", 14);
      \u0275\u0275text(22);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(23, "li")(24, "a", 15);
      \u0275\u0275element(25, "app-icon", 16);
      \u0275\u0275elementStart(26, "span");
      \u0275\u0275text(27);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(28, "li")(29, "a", 17);
      \u0275\u0275element(30, "app-icon", 18);
      \u0275\u0275elementStart(31, "span");
      \u0275\u0275text(32);
      \u0275\u0275element(33, "br");
      \u0275\u0275text(34);
      \u0275\u0275elementEnd()()()();
      \u0275\u0275elementStart(35, "h2", 19);
      \u0275\u0275text(36, "Hor\xE1rio");
      \u0275\u0275elementEnd();
      \u0275\u0275element(37, "app-opening-hours", 20);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(38, "div", 10)(39, "h2", 8);
      \u0275\u0275text(40, "Onde estamos");
      \u0275\u0275elementEnd();
      \u0275\u0275element(41, "app-map-embed", 21);
      \u0275\u0275elementStart(42, "a", 22);
      \u0275\u0275text(43, " Abrir no Google Maps ");
      \u0275\u0275element(44, "app-icon", 23);
      \u0275\u0275elementEnd()()()();
      \u0275\u0275elementStart(45, "div", 24)(46, "div", 25)(47, "p", 26);
      \u0275\u0275text(48);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(49, "p", 26);
      \u0275\u0275text(50);
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(4);
      \u0275\u0275property("src", ctx.site.logo, \u0275\u0275sanitizeUrl);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" ", ctx.site.description, " ");
      \u0275\u0275advance(6);
      \u0275\u0275repeater(ctx.links);
      \u0275\u0275advance(7);
      \u0275\u0275property("href", ctx.site.phone.href, \u0275\u0275sanitizeUrl);
      \u0275\u0275advance();
      \u0275\u0275property("size", 17);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.site.phone.display);
      \u0275\u0275advance(2);
      \u0275\u0275property("href", "mailto:" + ctx.site.email, \u0275\u0275sanitizeUrl);
      \u0275\u0275advance();
      \u0275\u0275property("size", 17);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.site.email);
      \u0275\u0275advance(2);
      \u0275\u0275property("href", ctx.site.address.directionsUrl, \u0275\u0275sanitizeUrl);
      \u0275\u0275advance();
      \u0275\u0275property("size", 17);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" ", ctx.site.address.street);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate2(" ", ctx.site.address.postalCode, " ", ctx.site.address.city, " ");
      \u0275\u0275advance(8);
      \u0275\u0275property("href", ctx.site.address.directionsUrl, \u0275\u0275sanitizeUrl);
      \u0275\u0275advance(2);
      \u0275\u0275property("size", 16);
      \u0275\u0275advance(4);
      \u0275\u0275textInterpolate2(" \xA9 ", ctx.currentYear, " ", ctx.site.name, ". Todos os direitos reservados. ");
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate2(" Oficina multimarca em ", ctx.site.address.city, " \xB7 ", ctx.site.address.country, " ");
    }
  }, dependencies: [RouterLink, Icon, MapEmbed, OpeningHours, SocialLinks], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Footer, [{
    type: Component,
    args: [{ selector: "app-footer", changeDetection: ChangeDetectionStrategy.OnPush, imports: [RouterLink, Icon, MapEmbed, OpeningHours, SocialLinks], host: { class: "block" }, template: `<footer class="bg-ink-950 pb-safe-nav text-bone-300">
  <div class="container-page py-16 lg:py-20">
    <div class="grid gap-12 lg:grid-cols-12 lg:gap-10">
      <!-- Brand -->
      <div class="lg:col-span-4">
        <img
          [src]="site.logo"
          alt="FS Automotive"
          width="661"
          height="182"
          loading="lazy"
          class="h-11 w-auto"
        />
        <p class="mt-6 max-w-sm text-sm leading-relaxed text-bone-400">
          {{ site.description }}
        </p>
        <app-social-links class="mt-7" tone="dark" />
      </div>

      <!-- Sitemap -->
      <nav class="lg:col-span-2" aria-label="Mapa do site">
        <h2 class="text-xs font-bold tracking-[0.16em] text-white uppercase">Navega\xE7\xE3o</h2>
        <ul class="mt-5 space-y-3">
          @for (link of links; track link.path) {
            <li>
              <a
                [routerLink]="link.path"
                class="group inline-flex items-center gap-1.5 py-1 text-sm text-bone-400 transition-colors duration-200 hover:text-brand-500 touch:py-2"
              >
                <app-icon
                  name="chevron-right"
                  [size]="13"
                  class="text-brand-600 transition-transform duration-200 group-hover:translate-x-0.5"
                />
                {{ link.label }}
              </a>
            </li>
          }
        </ul>
      </nav>

      <!-- Contacts -->
      <div class="lg:col-span-3">
        <h2 class="text-xs font-bold tracking-[0.16em] text-white uppercase">Contactos</h2>
        <ul class="mt-5 space-y-4 text-sm">
          <li>
            <a
              [href]="site.phone.href"
              class="group flex items-start gap-3 py-1 text-bone-400 transition-colors duration-200 hover:text-white touch:py-2"
            >
              <app-icon name="phone" [size]="17" class="mt-0.5 text-brand-500" />
              <span class="font-semibold tabular-nums">{{ site.phone.display }}</span>
            </a>
          </li>
          <li>
            <a
              [href]="'mailto:' + site.email"
              class="group flex items-start gap-3 py-1 break-all text-bone-400 transition-colors duration-200 hover:text-white touch:py-2"
            >
              <app-icon name="mail" [size]="17" class="mt-0.5 shrink-0 text-brand-500" />
              <span>{{ site.email }}</span>
            </a>
          </li>
          <li>
            <a
              [href]="site.address.directionsUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-start gap-3 py-1 text-bone-400 transition-colors duration-200 hover:text-white touch:py-2"
            >
              <app-icon name="map-pin" [size]="17" class="mt-0.5 shrink-0 text-brand-500" />
              <span>
                {{ site.address.street }}<br />
                {{ site.address.postalCode }} {{ site.address.city }}
              </span>
            </a>
          </li>
        </ul>

        <h2 class="mt-9 text-xs font-bold tracking-[0.16em] text-white uppercase">Hor\xE1rio</h2>
        <app-opening-hours class="mt-2" tone="dark" />
      </div>

      <!-- Map -->
      <div class="lg:col-span-3">
        <h2 class="text-xs font-bold tracking-[0.16em] text-white uppercase">Onde estamos</h2>
        <app-map-embed class="mt-5" frameClass="aspect-[4/3]" />
        <a
          [href]="site.address.directionsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-bone-300 transition-colors duration-200 hover:text-brand-500"
        >
          Abrir no Google Maps
          <app-icon name="arrow-up-right" [size]="16" />
        </a>
      </div>
    </div>
  </div>

  <div class="border-t border-white/8">
    <div
      class="container-page flex flex-col items-center justify-between gap-3 py-6 text-center sm:flex-row sm:text-left"
    >
      <p class="text-bone-500 text-xs">
        &copy; {{ currentYear }} {{ site.name }}. Todos os direitos reservados.
      </p>
      <p class="text-bone-500 text-xs">
        Oficina multimarca em {{ site.address.city }} &middot; {{ site.address.country }}
      </p>
    </div>
  </div>
</footer>
` }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Footer, { className: "Footer", filePath: "src/app/layout/footer/footer.ts", lineNumber: 18 });
})();

// src/app/layout/header/header.ts
var _c0 = () => ({ exact: false });
var _forTrack02 = ($index, $item) => $item.path;
function Header_For_9_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li")(1, "a", 13);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const link_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("routerLink", link_r1.path)("routerLinkActiveOptions", \u0275\u0275pureFunction0(3, _c0));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(link_r1.label);
  }
}
function Header_For_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275conditionalCreate(0, Header_For_9_Conditional_0_Template, 3, 4, "li");
  }
  if (rf & 2) {
    const link_r1 = ctx.$implicit;
    \u0275\u0275conditional(!link_r1.exact ? 0 : -1);
  }
}
var Header = class _Header {
  site = SITE;
  links = NAV_LINKS;
  scrolled = signal(false, ...ngDevMode ? [{ debugName: "scrolled" }] : (
    /* istanbul ignore next */
    []
  ));
  barClasses = computed(() => [
    "border-b border-white/5 bg-ink-950/95 backdrop-blur-md py-1 transition-shadow duration-300 tv:py-5",
    this.scrolled() ? "shadow-lg shadow-ink-950/25" : ""
  ].filter(Boolean).join(" "), ...ngDevMode ? [{ debugName: "barClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  onScroll() {
    this.scrolled.set(globalThis.scrollY > 8);
  }
  static \u0275fac = function Header_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Header)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Header, selectors: [["app-header"]], hostAttrs: [1, "sticky", "top-0", "z-50", "block"], hostBindings: function Header_HostBindings(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275listener("scroll", function Header_scroll_HostBindingHandler() {
        return ctx.onScroll();
      }, \u0275\u0275resolveWindow);
    }
  }, decls: 19, vars: 10, consts: [["href", "#conteudo", 1, "sr-only", "focus:not-sr-only", "focus:absolute", "focus:top-3", "focus:left-3", "focus:z-50", "focus:rounded-full", "focus:bg-brand-600", "focus:px-4", "focus:py-2", "focus:text-sm", "focus:font-semibold", "focus:text-white"], [1, "container-page", "flex", "items-center", "justify-between", "gap-6", "py-3.5", "lg:py-4"], ["routerLink", "/", "aria-label", "FS Automotive \u2014 p\xE1gina inicial", 1, "shrink-0", "transition-opacity", "duration-200", "hover:opacity-85"], ["alt", "FS Automotive", "width", "661", "height", "182", 1, "h-9", "w-auto", "sm:h-11", 3, "src"], ["aria-label", "Navega\xE7\xE3o principal", 1, "hidden", "md:block"], [1, "flex", "items-center", "gap-1"], [1, "flex", "items-center", "gap-3"], [1, "hidden", "items-center", "gap-2", "text-sm", "font-semibold", "text-bone-300", "transition-colors", "duration-200", "hover:text-white", "lg:inline-flex", 3, "href"], ["name", "phone", 1, "text-brand-500", 3, "size"], [1, "tabular-nums"], ["routerLink", "/contactos", "variant", "primary", "size", "sm", "icon", "arrow-right", 1, "hidden", "lg:inline-flex"], [1, "grid", "size-10", "place-items-center", "rounded-full", "bg-brand-600", "text-white", "transition", "hover:bg-brand-700", "lg:hidden", 3, "href"], ["name", "phone", 3, "size"], ["routerLinkActive", "text-white after:scale-x-100", 1, "relative", "block", "px-4", "py-2.5", "text-sm", "font-semibold", "text-bone-300", "transition-colors", "duration-200", "after:absolute", "after:inset-x-4", "after:-bottom-0.5", "after:h-0.5", "after:origin-left", "after:scale-x-0", "after:rounded-full", "after:bg-brand-600", "after:transition-transform", "after:duration-300", "hover:text-white", "hover:after:scale-x-100", "touch:py-3.5", 3, "routerLink", "routerLinkActiveOptions"]], template: function Header_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "a", 0);
      \u0275\u0275text(1, "Saltar para o conte\xFAdo");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(2, "header")(3, "div", 1)(4, "a", 2);
      \u0275\u0275element(5, "img", 3);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "nav", 4)(7, "ul", 5);
      \u0275\u0275repeaterCreate(8, Header_For_9_Template, 1, 1, null, null, _forTrack02);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(10, "div", 6)(11, "a", 7);
      \u0275\u0275element(12, "app-icon", 8);
      \u0275\u0275elementStart(13, "span", 9);
      \u0275\u0275text(14);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(15, "app-button", 10);
      \u0275\u0275text(16, "Pedir or\xE7amento");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(17, "a", 11);
      \u0275\u0275element(18, "app-icon", 12);
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275classMap(ctx.barClasses());
      \u0275\u0275advance(3);
      \u0275\u0275property("src", ctx.site.logo, \u0275\u0275sanitizeUrl);
      \u0275\u0275advance(3);
      \u0275\u0275repeater(ctx.links);
      \u0275\u0275advance(3);
      \u0275\u0275property("href", ctx.site.phone.href, \u0275\u0275sanitizeUrl);
      \u0275\u0275attribute("aria-label", "Ligar para " + ctx.site.phone.display);
      \u0275\u0275advance();
      \u0275\u0275property("size", 16);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.site.phone.display);
      \u0275\u0275advance(3);
      \u0275\u0275property("href", ctx.site.phone.href, \u0275\u0275sanitizeUrl);
      \u0275\u0275attribute("aria-label", "Ligar para " + ctx.site.phone.display);
      \u0275\u0275advance();
      \u0275\u0275property("size", 18);
    }
  }, dependencies: [RouterLink, RouterLinkActive, Icon, UiButton], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Header, [{
    type: Component,
    args: [{ selector: "app-header", changeDetection: ChangeDetectionStrategy.OnPush, imports: [RouterLink, RouterLinkActive, Icon, UiButton], host: {
      class: "sticky top-0 z-50 block",
      "(window:scroll)": "onScroll()"
    }, template: `<a
  href="#conteudo"
  class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
  >Saltar para o conte\xFAdo</a
>

<header [class]="barClasses()">
  <div class="container-page flex items-center justify-between gap-6 py-3.5 lg:py-4">
    <a
      routerLink="/"
      class="shrink-0 transition-opacity duration-200 hover:opacity-85"
      aria-label="FS Automotive \u2014 p\xE1gina inicial"
    >
      <img [src]="site.logo" alt="FS Automotive" width="661" height="182" class="h-9 w-auto sm:h-11" />
    </a>

    <nav aria-label="Navega\xE7\xE3o principal" class="hidden md:block">
      <ul class="flex items-center gap-1">
        @for (link of links; track link.path) {
          @if (!link.exact) {
            <li>
              <a
                [routerLink]="link.path"
                routerLinkActive="text-white after:scale-x-100"
                [routerLinkActiveOptions]="{ exact: false }"
                class="relative block px-4 py-2.5 text-sm font-semibold text-bone-300 transition-colors duration-200 after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-brand-600 after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100 touch:py-3.5"
                >{{ link.label }}</a
              >
            </li>
          }
        }
      </ul>
    </nav>

    <div class="flex items-center gap-3">
      <a
        [href]="site.phone.href"
        class="hidden items-center gap-2 text-sm font-semibold text-bone-300 transition-colors duration-200 hover:text-white lg:inline-flex"
        [attr.aria-label]="'Ligar para ' + site.phone.display"
      >
        <app-icon name="phone" [size]="16" class="text-brand-500" />
        <span class="tabular-nums">{{ site.phone.display }}</span>
      </a>

      <app-button
        routerLink="/contactos"
        variant="primary"
        size="sm"
        icon="arrow-right"
        class="hidden lg:inline-flex"
        >Pedir or\xE7amento</app-button
      >

      <a
        [href]="site.phone.href"
        class="grid size-10 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 lg:hidden"
        [attr.aria-label]="'Ligar para ' + site.phone.display"
      >
        <app-icon name="phone" [size]="18" />
      </a>
    </div>
  </div>
</header>
` }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Header, { className: "Header", filePath: "src/app/layout/header/header.ts", lineNumber: 22 });
})();

// src/app/layout/mobile-tab-bar/mobile-tab-bar.ts
var _c02 = (a0) => ({ exact: a0 });
var _forTrack03 = ($index, $item) => $item.path;
function MobileTabBar_For_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 3)(1, "a", 4, 0);
    \u0275\u0275element(3, "app-icon", 5);
    \u0275\u0275elementStart(4, "span", 6);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const link_r1 = ctx.$implicit;
    const rla_r2 = \u0275\u0275reference(2);
    \u0275\u0275advance();
    \u0275\u0275property("routerLink", link_r1.path)("routerLinkActiveOptions", \u0275\u0275pureFunction1(6, _c02, !!link_r1.exact));
    \u0275\u0275attribute("aria-current", rla_r2.isActive ? "page" : null);
    \u0275\u0275advance(2);
    \u0275\u0275property("name", link_r1.icon)("size", 21);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(link_r1.shortLabel);
  }
}
var MobileTabBar = class _MobileTabBar {
  links = NAV_LINKS;
  static \u0275fac = function MobileTabBar_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MobileTabBar)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _MobileTabBar, selectors: [["app-mobile-tab-bar"]], hostAttrs: [1, "md:hidden"], decls: 4, vars: 0, consts: [["rla", "routerLinkActive"], ["aria-label", "Navega\xE7\xE3o principal (m\xF3vel)", 1, "fixed", "inset-x-0", "bottom-0", "z-50", "border-t-2", "border-brand-600", "bg-ink-950/97", "pb-[env(safe-area-inset-bottom)]", "backdrop-blur-md"], [1, "flex", "items-stretch"], [1, "flex-1"], ["routerLinkActive", "text-brand-500 bg-white/5", 1, "flex", "min-h-16", "flex-col", "items-center", "justify-center", "gap-1", "px-1", "py-2", "text-bone-400", "transition-colors", "duration-200", "active:bg-white/10", 3, "routerLink", "routerLinkActiveOptions"], [3, "name", "size"], [1, "text-[0.75rem]", "leading-none", "font-semibold", "tracking-tight"]], template: function MobileTabBar_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "nav", 1)(1, "ul", 2);
      \u0275\u0275repeaterCreate(2, MobileTabBar_For_3_Template, 6, 8, "li", 3, _forTrack03);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275repeater(ctx.links);
    }
  }, dependencies: [RouterLink, RouterLinkActive, Icon], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MobileTabBar, [{
    type: Component,
    args: [{ selector: "app-mobile-tab-bar", changeDetection: ChangeDetectionStrategy.OnPush, imports: [RouterLink, RouterLinkActive, Icon], host: { class: "md:hidden" }, template: `<nav
  aria-label="Navega\xE7\xE3o principal (m\xF3vel)"
  class="fixed inset-x-0 bottom-0 z-50 border-t-2 border-brand-600 bg-ink-950/97 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
>
  <ul class="flex items-stretch">
    @for (link of links; track link.path) {
      <li class="flex-1">
        <a
          [routerLink]="link.path"
          routerLinkActive="text-brand-500 bg-white/5"
          [routerLinkActiveOptions]="{ exact: !!link.exact }"
          #rla="routerLinkActive"
          [attr.aria-current]="rla.isActive ? 'page' : null"
          class="flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-bone-400 transition-colors duration-200 active:bg-white/10"
        >
          <app-icon [name]="link.icon" [size]="21" />
          <span class="text-[0.75rem] leading-none font-semibold tracking-tight">{{ link.shortLabel }}</span>
        </a>
      </li>
    }
  </ul>
</nav>
` }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(MobileTabBar, { className: "MobileTabBar", filePath: "src/app/layout/mobile-tab-bar/mobile-tab-bar.ts", lineNumber: 18 });
})();

// src/app/app.ts
var App = class _App {
  router = inject(Router);
  seo = inject(SeoService);
  structuredData = inject(StructuredDataService);
  analytics = inject(AnalyticsService);
  /** The deepest active route's `meta`, recomputed after every navigation. */
  activeMeta = toSignal(this.router.events.pipe(filter((event) => event instanceof NavigationEnd), startWith(null), map(() => this.deepestMeta())), { initialValue: void 0 });
  constructor() {
    this.structuredData.publishLocalBusiness();
    this.analytics.initialize();
    effect(() => {
      const meta = this.activeMeta();
      if (meta) {
        this.seo.apply(meta);
      }
    });
  }
  deepestMeta() {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data["meta"];
  }
  static \u0275fac = function App_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _App)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _App, selectors: [["app-root"]], decls: 7, vars: 0, consts: [["id", "conteudo"]], template: function App_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275element(0, "app-header");
      \u0275\u0275elementStart(1, "main", 0);
      \u0275\u0275element(2, "router-outlet");
      \u0275\u0275elementEnd();
      \u0275\u0275element(3, "app-footer")(4, "app-mobile-tab-bar")(5, "app-lightbox")(6, "app-cookie-notice");
    }
  }, dependencies: [RouterOutlet, Header, Footer, MobileTabBar, Lightbox, CookieNotice], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(App, [{
    type: Component,
    args: [{ selector: "app-root", changeDetection: ChangeDetectionStrategy.OnPush, imports: [RouterOutlet, Header, Footer, MobileTabBar, Lightbox, CookieNotice], template: '<app-header />\n\n<main id="conteudo">\n  <router-outlet />\n</main>\n\n<app-footer />\n<app-mobile-tab-bar />\n<app-lightbox />\n<app-cookie-notice />\n' }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(App, { className: "App", filePath: "src/app/app.ts", lineNumber: 26 });
})();

// src/main.ts
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
//# sourceMappingURL=main.js.map
