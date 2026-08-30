import {
  OfficeGestService
} from "./chunk-QHRJKSEM.js";
import {
  PRIVATE_NAV
} from "./chunk-JPKAWCLC.js";
import {
  toSignal
} from "./chunk-TZW5CK7K.js";
import "./chunk-ZQIDUDRV.js";
import {
  AuthService
} from "./chunk-DWZ5PAW5.js";
import "./chunk-4AV4IBWC.js";
import "./chunk-GUS6C3RU.js";
import {
  Icon
} from "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  RouterLink,
  catchError,
  computed,
  inject,
  map,
  of,
  setClassMetadata,
  startWith,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/officegest/pages/dashboard/dashboard.ts
var _forTrack0 = ($index, $item) => $item.label;
var _forTrack1 = ($index, $item) => $item.path;
function Dashboard_For_10_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12)(1, "span", 16);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const tile_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("A carregar ", tile_r1.label);
  }
}
function Dashboard_For_10_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 13);
    \u0275\u0275text(1, "Indispon\xEDvel");
    \u0275\u0275elementEnd();
  }
}
function Dashboard_For_10_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 14);
    \u0275\u0275text(1, "\u2014");
    \u0275\u0275elementEnd();
  }
}
function Dashboard_For_10_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 15);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const tile_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(tile_r1.metric.value);
  }
}
function Dashboard_For_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5)(1, "div", 9);
    \u0275\u0275element(2, "app-icon", 10);
    \u0275\u0275elementStart(3, "p", 11);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
    \u0275\u0275conditionalCreate(5, Dashboard_For_10_Conditional_5_Template, 3, 1, "div", 12)(6, Dashboard_For_10_Conditional_6_Template, 2, 0, "p", 13)(7, Dashboard_For_10_Conditional_7_Template, 2, 0, "p", 14)(8, Dashboard_For_10_Conditional_8_Template, 2, 1, "p", 15);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const tile_r1 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("name", tile_r1.icon)("size", 18);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(tile_r1.label);
    \u0275\u0275advance();
    \u0275\u0275conditional(tile_r1.metric.loading ? 5 : tile_r1.metric.failed ? 6 : tile_r1.metric.value === null ? 7 : 8);
  }
}
function Dashboard_For_16_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 21);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r2.description);
  }
}
function Dashboard_For_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li")(1, "a", 17)(2, "span", 18);
    \u0275\u0275element(3, "app-icon", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 19)(5, "span", 20);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(7, Dashboard_For_16_Conditional_7_Template, 2, 1, "span", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275element(8, "app-icon", 22);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r2 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("routerLink", item_r2.path);
    \u0275\u0275advance(2);
    \u0275\u0275property("name", item_r2.icon)("size", 20);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(item_r2.label);
    \u0275\u0275advance();
    \u0275\u0275conditional(item_r2.description ? 7 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("size", 18);
  }
}
var PENDING = { value: null, loading: true, failed: false };
var Dashboard = class _Dashboard {
  officegest = inject(OfficeGestService);
  auth = inject(AuthService);
  user = this.auth.user;
  /** Everything except the dashboard itself, filtered by permission. */
  shortcuts = computed(() => {
    this.auth.user();
    return PRIVATE_NAV.filter((item) => !item.exact && (!item.permission || this.auth.hasPermission(item.permission)));
  }, ...ngDevMode ? [{ debugName: "shortcuts" }] : (
    /* istanbul ignore next */
    []
  ));
  customers = this.metric(() => this.officegest.listCustomers({ page: 1, perPage: 1 }));
  vehicles = this.metric(() => this.officegest.listVehicles({ page: 1, perPage: 1 }));
  appointments = this.metric(() => this.officegest.listAppointments({
    page: 1,
    perPage: 1,
    // From now on: the useful count is what is still to come, not the archive.
    from: (/* @__PURE__ */ new Date()).toISOString()
  }));
  /** Typed here rather than in the template, so `IconName` survives. */
  tiles = computed(() => [
    { label: "Clientes", icon: "users", metric: this.customers() },
    { label: "Ve\xEDculos", icon: "car", metric: this.vehicles() },
    { label: "Marca\xE7\xF5es futuras", icon: "calendar", metric: this.appointments() }
  ], ...ngDevMode ? [{ debugName: "tiles" }] : (
    /* istanbul ignore next */
    []
  ));
  greeting = computed(() => {
    const hour = (/* @__PURE__ */ new Date()).getHours();
    const name = this.user()?.name.split(" ")[0] ?? "";
    const salutation = hour < 12 ? "Bom dia" : hour < 20 ? "Boa tarde" : "Boa noite";
    return name ? `${salutation}, ${name}` : salutation;
  }, ...ngDevMode ? [{ debugName: "greeting" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Turns any list request into a tile state, without ever throwing. */
  metric(request) {
    return toSignal(request().pipe(map((page) => ({
      value: page.pagination.total ?? null,
      loading: false,
      failed: false
    })), catchError(() => of({ value: null, loading: false, failed: true })), startWith(PENDING)), { initialValue: PENDING });
  }
  static \u0275fac = function Dashboard_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Dashboard)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Dashboard, selectors: [["app-dashboard"]], decls: 17, vars: 1, consts: [[1, "text-h2", "text-ink-950"], [1, "mt-1", "text-body", "text-ink-500"], ["aria-labelledby", "resumo", 1, "mt-6"], ["id", "resumo", 1, "sr-only"], [1, "grid", "gap-4", "sm:grid-cols-3"], [1, "rounded-xl", "bg-white", "p-5", "shadow-card", "ring-1", "ring-ink-950/6"], ["aria-labelledby", "atalhos", 1, "mt-8"], ["id", "atalhos", 1, "text-h3", "text-ink-900"], ["role", "list", 1, "mt-4", "grid", "gap-4", "sm:grid-cols-2"], [1, "flex", "items-center", "gap-2.5", "text-ink-500"], [3, "name", "size"], [1, "text-meta", "font-semibold", "tracking-wide", "uppercase"], ["role", "status", 1, "mt-3", "h-8", "w-20", "animate-pulse", "rounded-lg", "bg-ink-100"], [1, "mt-3", "text-body", "text-ink-400"], ["title", "O OfficeGest n\xE3o indicou um total", 1, "mt-3", "text-h2", "text-ink-300"], [1, "mt-3", "text-h2", "text-ink-950", "tabular-nums"], [1, "sr-only"], [1, "group", "flex", "h-full", "items-start", "gap-4", "rounded-xl", "bg-white", "p-5", "shadow-card", "ring-1", "ring-ink-950/6", "transition-shadow", "hover:shadow-card-hover", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", 3, "routerLink"], [1, "flex", "size-10", "shrink-0", "items-center", "justify-center", "rounded-lg", "bg-bone-100", "text-ink-700", "transition-colors", "group-hover:bg-brand-600", "group-hover:text-white"], [1, "min-w-0"], [1, "block", "text-h3", "text-ink-900"], [1, "mt-1", "block", "text-meta", "text-ink-500"], ["name", "chevron-right", 1, "ml-auto", "shrink-0", "self-center", "text-ink-300", "transition-transform", "group-hover:translate-x-0.5", 3, "size"]], template: function Dashboard_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "header")(1, "h1", 0);
      \u0275\u0275text(2);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "p", 1);
      \u0275\u0275text(4, "Resumo dos dados do OfficeGest.");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(5, "section", 2)(6, "h2", 3);
      \u0275\u0275text(7, "Resumo");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(8, "div", 4);
      \u0275\u0275repeaterCreate(9, Dashboard_For_10_Template, 9, 4, "div", 5, _forTrack0);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(11, "section", 6)(12, "h2", 7);
      \u0275\u0275text(13, "Aceder");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(14, "ul", 8);
      \u0275\u0275repeaterCreate(15, Dashboard_For_16_Template, 9, 6, "li", null, _forTrack1);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.greeting());
      \u0275\u0275advance(7);
      \u0275\u0275repeater(ctx.tiles());
      \u0275\u0275advance(6);
      \u0275\u0275repeater(ctx.shortcuts());
    }
  }, dependencies: [Icon, RouterLink], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Dashboard, [{
    type: Component,
    args: [{ selector: "app-dashboard", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon, RouterLink], template: '<header>\n  <h1 class="text-h2 text-ink-950">{{ greeting() }}</h1>\n  <p class="mt-1 text-body text-ink-500">Resumo dos dados do OfficeGest.</p>\n</header>\n\n<section class="mt-6" aria-labelledby="resumo">\n  <h2 id="resumo" class="sr-only">Resumo</h2>\n\n  <div class="grid gap-4 sm:grid-cols-3">\n    @for (tile of tiles(); track tile.label) {\n      <div class="rounded-xl bg-white p-5 shadow-card ring-1 ring-ink-950/6">\n        <div class="flex items-center gap-2.5 text-ink-500">\n          <app-icon [name]="tile.icon" [size]="18" />\n          <p class="text-meta font-semibold tracking-wide uppercase">{{ tile.label }}</p>\n        </div>\n\n        @if (tile.metric.loading) {\n          <div class="mt-3 h-8 w-20 animate-pulse rounded-lg bg-ink-100" role="status">\n            <span class="sr-only">A carregar {{ tile.label }}</span>\n          </div>\n        } @else if (tile.metric.failed) {\n          <p class="mt-3 text-body text-ink-400">Indispon\xEDvel</p>\n        } @else if (tile.metric.value === null) {\n          <!-- The endpoint answered but reported no total; a zero here would\n               be a claim the data does not support. -->\n          <p class="mt-3 text-h2 text-ink-300" title="O OfficeGest n\xE3o indicou um total">\u2014</p>\n        } @else {\n          <p class="mt-3 text-h2 text-ink-950 tabular-nums">{{ tile.metric.value }}</p>\n        }\n      </div>\n    }\n  </div>\n</section>\n\n<section class="mt-8" aria-labelledby="atalhos">\n  <h2 id="atalhos" class="text-h3 text-ink-900">Aceder</h2>\n\n  <ul role="list" class="mt-4 grid gap-4 sm:grid-cols-2">\n    @for (item of shortcuts(); track item.path) {\n      <li>\n        <a\n          class="group flex h-full items-start gap-4 rounded-xl bg-white p-5 shadow-card ring-1 ring-ink-950/6 transition-shadow hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"\n          [routerLink]="item.path"\n        >\n          <span\n            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bone-100 text-ink-700 transition-colors group-hover:bg-brand-600 group-hover:text-white"\n          >\n            <app-icon [name]="item.icon" [size]="20" />\n          </span>\n\n          <span class="min-w-0">\n            <span class="block text-h3 text-ink-900">{{ item.label }}</span>\n            @if (item.description) {\n              <span class="mt-1 block text-meta text-ink-500">{{ item.description }}</span>\n            }\n          </span>\n\n          <app-icon\n            name="chevron-right"\n            [size]="18"\n            class="ml-auto shrink-0 self-center text-ink-300 transition-transform group-hover:translate-x-0.5"\n          />\n        </a>\n      </li>\n    }\n  </ul>\n</section>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Dashboard, { className: "Dashboard", filePath: "src/app/features/private/officegest/pages/dashboard/dashboard.ts", lineNumber: 45 });
})();
export {
  Dashboard
};
//# sourceMappingURL=chunk-B4BAVSRV.js.map
