import "./chunk-PWBEWDIV.js";
import {
  NotificationService
} from "./chunk-BWF5CPVO.js";
import "./chunk-H4LGSLFV.js";
import {
  SITE
} from "./chunk-UVBD33FH.js";
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
import {
  PRIVATE_ROUTES
} from "./chunk-GUS6C3RU.js";
import {
  Icon
} from "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  computed,
  filter,
  inject,
  map,
  setClassMetadata,
  signal,
  startWith,
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
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/layout/toast-host/toast-host.ts
var _forTrack0 = ($index, $item) => $item.id;
function ToastHost_For_1_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r2.detail);
  }
}
function ToastHost_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "span");
    \u0275\u0275element(2, "app-icon", 2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 3)(4, "p", 4);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(6, ToastHost_For_1_Conditional_6_Template, 2, 1, "p", 5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "button", 6);
    \u0275\u0275listener("click", function ToastHost_For_1_Template_button_click_7_listener() {
      const item_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.dismiss(item_r2.id));
    });
    \u0275\u0275elementStart(8, "span", 7);
    \u0275\u0275text(9, "Dispensar notifica\xE7\xE3o");
    \u0275\u0275elementEnd();
    \u0275\u0275element(10, "app-icon", 8);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classMap("pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 shadow-card ring-1 " + ctx_r2.toneStyles[item_r2.tone]);
    \u0275\u0275attribute("role", item_r2.tone === "error" ? "alert" : "status")("aria-live", item_r2.tone === "error" ? "assertive" : "polite");
    \u0275\u0275advance();
    \u0275\u0275classMap("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full " + ctx_r2.toneIconStyles[item_r2.tone]);
    \u0275\u0275advance();
    \u0275\u0275property("name", ctx_r2.toneIcons[item_r2.tone])("size", 16);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(item_r2.message);
    \u0275\u0275advance();
    \u0275\u0275conditional(item_r2.detail ? 6 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275property("size", 16);
  }
}
var TONE_STYLES = {
  success: "bg-white ring-emerald-600/20 text-ink-900",
  error: "bg-white ring-brand-600/25 text-ink-900",
  warning: "bg-white ring-amber-600/25 text-ink-900",
  info: "bg-white ring-sky-600/20 text-ink-900"
};
var TONE_ICONS = {
  success: "check",
  error: "alert-triangle",
  warning: "alert-triangle",
  info: "info"
};
var TONE_ICON_STYLES = {
  success: "bg-emerald-50 text-emerald-700",
  error: "bg-brand-50 text-brand-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-sky-50 text-sky-700"
};
var ToastHost = class _ToastHost {
  service = inject(NotificationService);
  notifications = this.service.notifications;
  toneStyles = TONE_STYLES;
  toneIcons = TONE_ICONS;
  toneIconStyles = TONE_ICON_STYLES;
  dismiss(id) {
    this.service.dismiss(id);
  }
  static \u0275fac = function ToastHost_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ToastHost)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ToastHost, selectors: [["app-toast-host"]], hostAttrs: [1, "pointer-events-none", "fixed", "inset-x-0", "bottom-0", "z-50", "flex", "flex-col", "items-center", "gap-2", "p-4", "sm:inset-x-auto", "sm:right-0", "sm:bottom-0", "sm:items-end"], decls: 2, vars: 0, consts: [["aria-relevant", "additions", 3, "class"], ["aria-relevant", "additions"], [3, "name", "size"], [1, "min-w-0", "flex-1"], [1, "text-body", "font-medium"], [1, "mt-0.5", "text-meta", "break-words", "text-ink-500"], ["type", "button", 1, "-mr-1", "shrink-0", "rounded-full", "p-1", "text-ink-400", "transition-colors", "hover:bg-ink-100", "hover:text-ink-700", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", 3, "click"], [1, "sr-only"], ["name", "close", 3, "size"]], template: function ToastHost_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275repeaterCreate(0, ToastHost_For_1_Template, 11, 11, "div", 0, _forTrack0);
    }
    if (rf & 2) {
      \u0275\u0275repeater(ctx.notifications());
    }
  }, dependencies: [Icon], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ToastHost, [{
    type: Component,
    args: [{ selector: "app-toast-host", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon], host: {
      class: "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:bottom-0 sm:items-end"
    }, template: `@for (item of notifications(); track item.id) {
  <div
    [attr.role]="item.tone === 'error' ? 'alert' : 'status'"
    [attr.aria-live]="item.tone === 'error' ? 'assertive' : 'polite'"
    aria-relevant="additions"
    [class]="
      'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 shadow-card ring-1 ' +
      toneStyles[item.tone]
    "
  >
    <span
      [class]="
        'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ' + toneIconStyles[item.tone]
      "
    >
      <app-icon [name]="toneIcons[item.tone]" [size]="16" />
    </span>

    <div class="min-w-0 flex-1">
      <p class="text-body font-medium">{{ item.message }}</p>
      @if (item.detail) {
        <p class="mt-0.5 text-meta break-words text-ink-500">{{ item.detail }}</p>
      }
    </div>

    <button
      type="button"
      class="-mr-1 shrink-0 rounded-full p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      (click)="dismiss(item.id)"
    >
      <span class="sr-only">Dispensar notifica\xE7\xE3o</span>
      <app-icon name="close" [size]="16" />
    </button>
  </div>
}
` }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ToastHost, { className: "ToastHost", filePath: "src/app/features/private/layout/toast-host/toast-host.ts", lineNumber: 53 });
})();

// src/app/features/private/layout/private-shell.ts
var _c0 = (a0) => ({ exact: a0 });
var _forTrack02 = ($index, $item) => $item.path;
function PrivateShell_For_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "li")(1, "a", 30, 0);
    \u0275\u0275listener("click", function PrivateShell_For_17_Template_a_click_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closeDrawer());
    });
    \u0275\u0275element(3, "app-icon", 31);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r3 = ctx.$implicit;
    const active_r4 = \u0275\u0275reference(2);
    \u0275\u0275advance();
    \u0275\u0275property("routerLink", item_r3.path)("routerLinkActiveOptions", \u0275\u0275pureFunction1(6, _c0, item_r3.exact ?? false));
    \u0275\u0275attribute("aria-current", active_r4.isActive ? "page" : null);
    \u0275\u0275advance(2);
    \u0275\u0275property("name", item_r3.icon)("size", 18);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", item_r3.label, " ");
  }
}
function PrivateShell_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 32);
    \u0275\u0275listener("click", function PrivateShell_Conditional_22_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closeDrawer());
    });
    \u0275\u0275elementStart(1, "span", 10);
    \u0275\u0275text(2, "Fechar menu");
    \u0275\u0275elementEnd()();
  }
}
function PrivateShell_Conditional_38_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 36);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function PrivateShell_Conditional_38_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 33);
    \u0275\u0275listener("click", function PrivateShell_Conditional_38_Template_div_click_0_listener($event) {
      return $event.stopPropagation();
    });
    \u0275\u0275elementStart(1, "div", 34)(2, "p", 35);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(4, PrivateShell_Conditional_38_Conditional_4_Template, 2, 1, "p", 36);
    \u0275\u0275elementStart(5, "p", 37);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "button", 38);
    \u0275\u0275listener("click", function PrivateShell_Conditional_38_Template_button_click_7_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.signOut());
    });
    \u0275\u0275element(8, "app-icon", 39);
    \u0275\u0275text(9, " Terminar sess\xE3o ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_1_0;
    let tmp_2_0;
    let tmp_3_0;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate((tmp_1_0 = ctx_r1.user()) == null ? null : tmp_1_0.name);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_2_0 = (tmp_2_0 = ctx_r1.user()) == null ? null : tmp_2_0.email) ? 4 : -1, tmp_2_0);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((tmp_3_0 = ctx_r1.user()) == null ? null : tmp_3_0.role);
    \u0275\u0275advance(2);
    \u0275\u0275property("size", 16);
  }
}
var PrivateShell = class _PrivateShell {
  auth = inject(AuthService);
  router = inject(Router);
  site = SITE;
  routes = PRIVATE_ROUTES;
  user = this.auth.user;
  initials = this.auth.initials;
  drawerOpen = signal(false, ...ngDevMode ? [{ debugName: "drawerOpen" }] : (
    /* istanbul ignore next */
    []
  ));
  accountMenuOpen = signal(false, ...ngDevMode ? [{ debugName: "accountMenuOpen" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Only the destinations this user may actually open. */
  navItems = computed(() => {
    this.auth.user();
    return PRIVATE_NAV.filter((item) => !item.permission || this.auth.hasPermission(item.permission));
  }, ...ngDevMode ? [{ debugName: "navItems" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Names the current page in the mobile header, where the sidebar is hidden. */
  currentTitle = toSignal(this.router.events.pipe(filter((event) => event instanceof NavigationEnd), startWith(null), map(() => {
    const url = this.router.url.split("?")[0] ?? "";
    return [...PRIVATE_NAV].sort((a, b) => b.path.length - a.path.length).find((item) => url.startsWith(item.path))?.label ?? "Gest\xE3o";
  })), { initialValue: "Gest\xE3o" });
  openDrawer() {
    this.drawerOpen.set(true);
  }
  closeDrawer() {
    this.drawerOpen.set(false);
    this.accountMenuOpen.set(false);
  }
  toggleAccountMenu(event) {
    event.stopPropagation();
    this.accountMenuOpen.update((open) => !open);
  }
  async signOut() {
    this.closeDrawer();
    await this.auth.logout();
    await this.router.navigate([PRIVATE_ROUTES.login]);
  }
  static \u0275fac = function PrivateShell_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PrivateShell)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PrivateShell, selectors: [["app-private-shell"]], hostAttrs: [1, "block", "min-h-dvh", "bg-bone-100"], hostBindings: function PrivateShell_HostBindings(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275listener("keydown.escape", function PrivateShell_keydown_escape_HostBindingHandler() {
        return ctx.closeDrawer();
      }, \u0275\u0275resolveDocument)("click", function PrivateShell_click_HostBindingHandler() {
        return ctx.accountMenuOpen.set(false);
      }, \u0275\u0275resolveDocument);
    }
  }, decls: 42, vars: 15, consts: [["active", "routerLinkActive"], ["href", "#gestao-conteudo", 1, "sr-only", "focus:not-sr-only", "focus:absolute", "focus:top-3", "focus:left-3", "focus:z-60", "focus:rounded-full", "focus:bg-ink-950", "focus:px-4", "focus:py-2", "focus:text-white"], [1, "lg:grid", "lg:grid-cols-[16rem_1fr]"], ["id", "gestao-navegacao"], [1, "flex", "h-16", "items-center", "justify-between", "px-5"], [1, "flex", "items-center", "gap-2.5", "rounded-sm", "focus-visible:outline-2", "focus-visible:outline-offset-4", "focus-visible:outline-white", 3, "click", "routerLink"], [1, "flex", "size-8", "items-center", "justify-center", "rounded-lg", "bg-brand-600", "text-white"], ["name", "wrench", 3, "size"], [1, "text-body", "font-extrabold", "tracking-tight", "text-white"], ["type", "button", 1, "rounded-full", "p-2", "text-bone-300", "transition-colors", "hover:bg-white/10", "hover:text-white", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-white", "lg:hidden", 3, "click"], [1, "sr-only"], ["name", "close", 3, "size"], ["aria-label", "Navega\xE7\xE3o da \xE1rea de gest\xE3o", 1, "flex-1", "overflow-y-auto", "px-3", "py-4"], ["role", "list", 1, "space-y-1"], [1, "border-t", "border-white/8", "p-3"], ["routerLink", "/", 1, "flex", "items-center", "gap-3", "rounded-lg", "px-3", "py-2.5", "text-meta", "text-bone-400", "transition-colors", "hover:bg-white/8", "hover:text-white", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-white", 3, "click"], ["name", "external-link", 3, "size"], ["type", "button", 1, "fixed", "inset-0", "z-40", "bg-ink-950/50", "backdrop-blur-sm", "lg:hidden"], [1, "flex", "min-w-0", "flex-col"], [1, "sticky", "top-0", "z-30", "flex", "h-16", "items-center", "gap-3", "border-b", "border-ink-950/8", "bg-bone-100/95", "px-4", "backdrop-blur-md", "sm:px-6"], ["type", "button", "aria-controls", "gestao-navegacao", 1, "-ml-1", "rounded-full", "p-2", "text-ink-700", "transition-colors", "hover:bg-ink-950/6", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", "lg:hidden", 3, "click"], ["name", "menu", 3, "size"], [1, "truncate", "text-body", "font-semibold", "text-ink-900", "lg:hidden"], [1, "relative", "ml-auto"], ["type", "button", "aria-haspopup", "menu", 1, "flex", "items-center", "gap-2.5", "rounded-full", "py-1", "pr-3", "pl-1", "transition-colors", "hover:bg-ink-950/6", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", 3, "click"], ["aria-hidden", "true", 1, "flex", "size-8", "items-center", "justify-center", "rounded-full", "bg-ink-900", "text-meta", "font-bold", "text-white"], [1, "hidden", "text-meta", "font-semibold", "text-ink-800", "sm:block"], ["name", "chevron-down", 1, "text-ink-400", 3, "size"], ["role", "menu", 1, "absolute", "right-0", "z-40", "mt-2", "w-60", "rounded-xl", "bg-white", "p-1.5", "shadow-card", "ring-1", "ring-ink-950/8"], ["id", "gestao-conteudo", 1, "min-w-0", "flex-1", "px-4", "py-6", "sm:px-6", "sm:py-8"], ["routerLinkActive", "bg-brand-600! text-white! shadow-brand", 1, "flex", "items-center", "gap-3", "rounded-lg", "px-3", "py-2.5", "text-body", "font-medium", "text-bone-300", "transition-colors", "hover:bg-white/8", "hover:text-white", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-white", 3, "click", "routerLink", "routerLinkActiveOptions"], [3, "name", "size"], ["type", "button", 1, "fixed", "inset-0", "z-40", "bg-ink-950/50", "backdrop-blur-sm", "lg:hidden", 3, "click"], ["role", "menu", 1, "absolute", "right-0", "z-40", "mt-2", "w-60", "rounded-xl", "bg-white", "p-1.5", "shadow-card", "ring-1", "ring-ink-950/8", 3, "click"], [1, "border-b", "border-ink-950/6", "px-3", "py-2.5"], [1, "truncate", "text-body", "font-semibold", "text-ink-900"], [1, "truncate", "text-meta", "text-ink-500"], [1, "mt-1.5", "text-meta", "text-ink-400"], ["type", "button", "role", "menuitem", 1, "mt-1", "flex", "w-full", "items-center", "gap-2.5", "rounded-lg", "px-3", "py-2", "text-left", "text-body", "text-ink-700", "transition-colors", "hover:bg-bone-100", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", 3, "click"], ["name", "log-out", 3, "size"]], template: function PrivateShell_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "a", 1);
      \u0275\u0275text(1, "Saltar para o conte\xFAdo");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(2, "div", 2)(3, "aside", 3)(4, "div", 4)(5, "a", 5);
      \u0275\u0275listener("click", function PrivateShell_Template_a_click_5_listener() {
        return ctx.closeDrawer();
      });
      \u0275\u0275elementStart(6, "span", 6);
      \u0275\u0275element(7, "app-icon", 7);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(8, "span", 8);
      \u0275\u0275text(9, "Gest\xE3o");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(10, "button", 9);
      \u0275\u0275listener("click", function PrivateShell_Template_button_click_10_listener() {
        return ctx.closeDrawer();
      });
      \u0275\u0275elementStart(11, "span", 10);
      \u0275\u0275text(12, "Fechar menu");
      \u0275\u0275elementEnd();
      \u0275\u0275element(13, "app-icon", 11);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(14, "nav", 12)(15, "ul", 13);
      \u0275\u0275repeaterCreate(16, PrivateShell_For_17_Template, 5, 8, "li", null, _forTrack02);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(18, "div", 14)(19, "a", 15);
      \u0275\u0275listener("click", function PrivateShell_Template_a_click_19_listener() {
        return ctx.closeDrawer();
      });
      \u0275\u0275element(20, "app-icon", 16);
      \u0275\u0275text(21, " Ver o site p\xFAblico ");
      \u0275\u0275elementEnd()()();
      \u0275\u0275conditionalCreate(22, PrivateShell_Conditional_22_Template, 3, 0, "button", 17);
      \u0275\u0275elementStart(23, "div", 18)(24, "header", 19)(25, "button", 20);
      \u0275\u0275listener("click", function PrivateShell_Template_button_click_25_listener() {
        return ctx.openDrawer();
      });
      \u0275\u0275elementStart(26, "span", 10);
      \u0275\u0275text(27, "Abrir menu");
      \u0275\u0275elementEnd();
      \u0275\u0275element(28, "app-icon", 21);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(29, "p", 22);
      \u0275\u0275text(30);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(31, "div", 23)(32, "button", 24);
      \u0275\u0275listener("click", function PrivateShell_Template_button_click_32_listener($event) {
        return ctx.toggleAccountMenu($event);
      });
      \u0275\u0275elementStart(33, "span", 25);
      \u0275\u0275text(34);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(35, "span", 26);
      \u0275\u0275text(36);
      \u0275\u0275elementEnd();
      \u0275\u0275element(37, "app-icon", 27);
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(38, PrivateShell_Conditional_38_Template, 10, 4, "div", 28);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(39, "main", 29);
      \u0275\u0275element(40, "router-outlet");
      \u0275\u0275elementEnd()()();
      \u0275\u0275element(41, "app-toast-host");
    }
    if (rf & 2) {
      let tmp_12_0;
      \u0275\u0275advance(3);
      \u0275\u0275classMap("fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-ink-950 transition-[transform,visibility] duration-300 ease-out lg:visible lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-auto lg:max-w-none lg:translate-x-0 " + (ctx.drawerOpen() ? "visible translate-x-0" : "invisible -translate-x-full"));
      \u0275\u0275advance(2);
      \u0275\u0275property("routerLink", ctx.routes.dashboard);
      \u0275\u0275advance(2);
      \u0275\u0275property("size", 18);
      \u0275\u0275advance(6);
      \u0275\u0275property("size", 20);
      \u0275\u0275advance(3);
      \u0275\u0275repeater(ctx.navItems());
      \u0275\u0275advance(4);
      \u0275\u0275property("size", 16);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.drawerOpen() ? 22 : -1);
      \u0275\u0275advance(3);
      \u0275\u0275attribute("aria-expanded", ctx.drawerOpen());
      \u0275\u0275advance(3);
      \u0275\u0275property("size", 20);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.currentTitle());
      \u0275\u0275advance(2);
      \u0275\u0275attribute("aria-expanded", ctx.accountMenuOpen());
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.initials());
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" ", (tmp_12_0 = ctx.user()) == null ? null : tmp_12_0.name, " ");
      \u0275\u0275advance();
      \u0275\u0275property("size", 16);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.accountMenuOpen() ? 38 : -1);
    }
  }, dependencies: [RouterOutlet, RouterLink, RouterLinkActive, Icon, ToastHost], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PrivateShell, [{
    type: Component,
    args: [{ selector: "app-private-shell", changeDetection: ChangeDetectionStrategy.OnPush, imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, ToastHost], host: {
      class: "block min-h-dvh bg-bone-100",
      "(document:keydown.escape)": "closeDrawer()",
      // A dropdown that only closes via its own button is a dead end for anyone
      // who clicks elsewhere first. The menu's own toggle stops propagation, so
      // this only ever fires for clicks outside it.
      "(document:click)": "accountMenuOpen.set(false)"
    }, template: '<a\n  class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-60 focus:rounded-full focus:bg-ink-950 focus:px-4 focus:py-2 focus:text-white"\n  href="#gestao-conteudo"\n  >Saltar para o conte\xFAdo</a\n>\n\n<div class="lg:grid lg:grid-cols-[16rem_1fr]">\n  <!--\n    Sidebar. Permanent from `lg`; a drawer below it.\n\n    Closed state is `invisible`, not just `-translate-x-full`: a transform moves\n    the panel off screen but leaves its links in the tab order, so a keyboard\n    user would tab into a menu nobody can see. `visibility` removes them, and\n    `lg:visible` brings the permanent sidebar back on desktop.\n  -->\n  <aside\n    id="gestao-navegacao"\n    [class]="\n      \'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-ink-950 transition-[transform,visibility] duration-300 ease-out lg:visible lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-auto lg:max-w-none lg:translate-x-0 \' +\n      (drawerOpen() ? \'visible translate-x-0\' : \'invisible -translate-x-full\')\n    "\n  >\n    <div class="flex h-16 items-center justify-between px-5">\n      <a\n        class="flex items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"\n        [routerLink]="routes.dashboard"\n        (click)="closeDrawer()"\n      >\n        <span class="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white">\n          <app-icon name="wrench" [size]="18" />\n        </span>\n        <span class="text-body font-extrabold tracking-tight text-white">Gest\xE3o</span>\n      </a>\n\n      <button\n        type="button"\n        class="rounded-full p-2 text-bone-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:hidden"\n        (click)="closeDrawer()"\n      >\n        <span class="sr-only">Fechar menu</span>\n        <app-icon name="close" [size]="20" />\n      </button>\n    </div>\n\n    <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Navega\xE7\xE3o da \xE1rea de gest\xE3o">\n      <ul role="list" class="space-y-1">\n        @for (item of navItems(); track item.path) {\n          <li>\n            <a\n              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-body font-medium text-bone-300 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"\n              [routerLink]="item.path"\n              routerLinkActive="bg-brand-600! text-white! shadow-brand"\n              [routerLinkActiveOptions]="{ exact: item.exact ?? false }"\n              #active="routerLinkActive"\n              [attr.aria-current]="active.isActive ? \'page\' : null"\n              (click)="closeDrawer()"\n            >\n              <app-icon [name]="item.icon" [size]="18" />\n              {{ item.label }}\n            </a>\n          </li>\n        }\n      </ul>\n    </nav>\n\n    <div class="border-t border-white/8 p-3">\n      <a\n        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-meta text-bone-400 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"\n        routerLink="/"\n        (click)="closeDrawer()"\n      >\n        <app-icon name="external-link" [size]="16" />\n        Ver o site p\xFAblico\n      </a>\n    </div>\n  </aside>\n\n  <!-- Backdrop: a real button, so it is reachable and dismissible without a mouse. -->\n  @if (drawerOpen()) {\n    <button\n      type="button"\n      class="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm lg:hidden"\n      (click)="closeDrawer()"\n    >\n      <span class="sr-only">Fechar menu</span>\n    </button>\n  }\n\n  <div class="flex min-w-0 flex-col">\n    <header\n      class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-950/8 bg-bone-100/95 px-4 backdrop-blur-md sm:px-6"\n    >\n      <button\n        type="button"\n        class="-ml-1 rounded-full p-2 text-ink-700 transition-colors hover:bg-ink-950/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 lg:hidden"\n        [attr.aria-expanded]="drawerOpen()"\n        aria-controls="gestao-navegacao"\n        (click)="openDrawer()"\n      >\n        <span class="sr-only">Abrir menu</span>\n        <app-icon name="menu" [size]="20" />\n      </button>\n\n      <p class="truncate text-body font-semibold text-ink-900 lg:hidden">{{ currentTitle() }}</p>\n\n      <div class="relative ml-auto">\n        <button\n          type="button"\n          class="flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-ink-950/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"\n          [attr.aria-expanded]="accountMenuOpen()"\n          aria-haspopup="menu"\n          (click)="toggleAccountMenu($event)"\n        >\n          <span\n            class="flex size-8 items-center justify-center rounded-full bg-ink-900 text-meta font-bold text-white"\n            aria-hidden="true"\n            >{{ initials() }}</span\n          >\n          <span class="hidden text-meta font-semibold text-ink-800 sm:block">\n            {{ user()?.name }}\n          </span>\n          <app-icon name="chevron-down" [size]="16" class="text-ink-400" />\n        </button>\n\n        @if (accountMenuOpen()) {\n          <div\n            role="menu"\n            class="absolute right-0 z-40 mt-2 w-60 rounded-xl bg-white p-1.5 shadow-card ring-1 ring-ink-950/8"\n            (click)="$event.stopPropagation()"\n          >\n            <div class="border-b border-ink-950/6 px-3 py-2.5">\n              <p class="truncate text-body font-semibold text-ink-900">{{ user()?.name }}</p>\n              @if (user()?.email; as email) {\n                <p class="truncate text-meta text-ink-500">{{ email }}</p>\n              }\n              <p class="mt-1.5 text-meta text-ink-400">{{ user()?.role }}</p>\n            </div>\n\n            <button\n              type="button"\n              role="menuitem"\n              class="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-body text-ink-700 transition-colors hover:bg-bone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"\n              (click)="signOut()"\n            >\n              <app-icon name="log-out" [size]="16" />\n              Terminar sess\xE3o\n            </button>\n          </div>\n        }\n      </div>\n    </header>\n\n    <main id="gestao-conteudo" class="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">\n      <router-outlet />\n    </main>\n  </div>\n</div>\n\n<app-toast-host />\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PrivateShell, { className: "PrivateShell", filePath: "src/app/features/private/layout/private-shell.ts", lineNumber: 47 });
})();
export {
  PrivateShell
};
//# sourceMappingURL=chunk-6NQGTOEV.js.map
