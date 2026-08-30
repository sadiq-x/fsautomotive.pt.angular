import {
  StatePanel,
  StatusBadge
} from "./chunk-2LZNZMJ7.js";
import {
  toObservable,
  toSignal
} from "./chunk-TZW5CK7K.js";
import {
  ApiError
} from "./chunk-4AV4IBWC.js";
import {
  Icon
} from "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  Input,
  RouterLink,
  catchError,
  computed,
  inject,
  input,
  map,
  of,
  setClassMetadata,
  signal,
  startWith,
  switchMap,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵsanitizeUrl,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/officegest/components/detail-list/detail-list.ts
var _forTrack0 = ($index, $item) => $item.label;
function DetailList_For_2_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 4);
    \u0275\u0275text(1, "\u2014");
    \u0275\u0275elementEnd();
  }
}
function DetailList_For_2_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-status-badge", 5);
  }
  if (rf & 2) {
    const field_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("label", field_r1.value);
  }
}
function DetailList_For_2_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const field_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("href", field_r1.href, \u0275\u0275sanitizeUrl);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(field_r1.value);
  }
}
function DetailList_For_2_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const field_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275textInterpolate1(" ", field_r1.value, " ");
  }
}
function DetailList_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "dt", 2);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "dd", 3);
    \u0275\u0275conditionalCreate(4, DetailList_For_2_Conditional_4_Template, 2, 0, "span", 4)(5, DetailList_For_2_Conditional_5_Template, 1, 1, "app-status-badge", 5)(6, DetailList_For_2_Conditional_6_Template, 2, 2, "a", 6)(7, DetailList_For_2_Conditional_7_Template, 1, 1);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const field_r1 = ctx.$implicit;
    \u0275\u0275classMap(field_r1.wide ? "sm:col-span-2" : "");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(field_r1.label);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(field_r1.value === null ? 4 : field_r1.badge ? 5 : field_r1.href ? 6 : 7);
  }
}
var DetailList = class _DetailList {
  fields = input.required(...ngDevMode ? [{ debugName: "fields" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function DetailList_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DetailList)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DetailList, selectors: [["app-detail-list"]], hostAttrs: [1, "block"], inputs: { fields: [1, "fields"] }, decls: 3, vars: 0, consts: [[1, "grid", "gap-x-8", "gap-y-5", "sm:grid-cols-2"], [3, "class"], [1, "text-meta", "font-semibold", "tracking-wide", "text-ink-400", "uppercase"], [1, "mt-1", "text-body", "text-ink-900"], [1, "text-ink-400"], [3, "label"], [1, "text-brand-700", "underline", "decoration-brand-700/30", "underline-offset-4", "transition-colors", "hover:text-brand-800", "hover:decoration-brand-700/70", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", 3, "href"]], template: function DetailList_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "dl", 0);
      \u0275\u0275repeaterCreate(1, DetailList_For_2_Template, 8, 4, "div", 1, _forTrack0);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.fields());
    }
  }, dependencies: [StatusBadge], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DetailList, [{
    type: Component,
    args: [{ selector: "app-detail-list", changeDetection: ChangeDetectionStrategy.OnPush, imports: [StatusBadge], host: { class: "block" }, template: `<dl class="grid gap-x-8 gap-y-5 sm:grid-cols-2">
  @for (field of fields(); track field.label) {
    <div [class]="field.wide ? 'sm:col-span-2' : ''">
      <dt class="text-meta font-semibold tracking-wide text-ink-400 uppercase">{{ field.label }}</dt>
      <dd class="mt-1 text-body text-ink-900">
        @if (field.value === null) {
          <span class="text-ink-400">\u2014</span>
        } @else if (field.badge) {
          <app-status-badge [label]="field.value" />
        } @else if (field.href) {
          <a
            class="text-brand-700 underline decoration-brand-700/30 underline-offset-4 transition-colors hover:text-brand-800 hover:decoration-brand-700/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            [href]="field.href"
            >{{ field.value }}</a
          >
        } @else {
          {{ field.value }}
        }
      </dd>
    </div>
  }
</dl>
` }]
  }], null, { fields: [{ type: Input, args: [{ isSignal: true, alias: "fields", required: true }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DetailList, { className: "DetailList", filePath: "src/app/features/private/officegest/components/detail-list/detail-list.ts", lineNumber: 31 });
})();

// src/app/features/private/officegest/components/detail-page/detail-page.ts
var _c0 = ["*"];
var _c1 = () => [0, 1, 2, 3, 4, 5];
function DetailPage_Case_3_For_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div");
    \u0275\u0275element(1, "div", 9)(2, "div", 10);
    \u0275\u0275elementEnd();
  }
}
function DetailPage_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 2)(1, "span", 5);
    \u0275\u0275text(2, "A carregar\u2026");
    \u0275\u0275elementEnd();
    \u0275\u0275element(3, "div", 6);
    \u0275\u0275elementStart(4, "div", 7)(5, "div", 8);
    \u0275\u0275repeaterCreate(6, DetailPage_Case_3_For_7_Template, 3, 0, "div", null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(6);
    \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c1));
  }
}
function DetailPage_Case_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-state-panel", 3);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("message", ctx_r0.missingMessage());
  }
}
function DetailPage_Case_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-state-panel", 4);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("message", ctx_r0.errorMessage());
  }
}
function DetailPage_Case_6_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 13);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.subtitle());
  }
}
function DetailPage_Case_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "header", 11)(1, "h1", 12);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(3, DetailPage_Case_6_Conditional_3_Template, 2, 1, "p", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 14);
    \u0275\u0275projection(5);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.title());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r0.subtitle() ? 3 : -1);
  }
}
var DetailPage = class _DetailPage {
  status = input.required(...ngDevMode ? [{ debugName: "status" }] : (
    /* istanbul ignore next */
    []
  ));
  title = input.required(...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  subtitle = input(null, ...ngDevMode ? [{ debugName: "subtitle" }] : (
    /* istanbul ignore next */
    []
  ));
  backLink = input.required(...ngDevMode ? [{ debugName: "backLink" }] : (
    /* istanbul ignore next */
    []
  ));
  backLabel = input.required(...ngDevMode ? [{ debugName: "backLabel" }] : (
    /* istanbul ignore next */
    []
  ));
  errorMessage = input(null, ...ngDevMode ? [{ debugName: "errorMessage" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Shown in the `missing` state, e.g. "Este cliente não existe no OfficeGest." */
  missingMessage = input("O registo n\xE3o existe ou foi removido.", ...ngDevMode ? [{ debugName: "missingMessage" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function DetailPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DetailPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DetailPage, selectors: [["app-detail-page"]], hostAttrs: [1, "block"], inputs: { status: [1, "status"], title: [1, "title"], subtitle: [1, "subtitle"], backLink: [1, "backLink"], backLabel: [1, "backLabel"], errorMessage: [1, "errorMessage"], missingMessage: [1, "missingMessage"] }, ngContentSelectors: _c0, decls: 7, vars: 4, consts: [[1, "inline-flex", "items-center", "gap-1.5", "rounded-sm", "text-meta", "font-semibold", "text-ink-500", "transition-colors", "hover:text-ink-900", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", 3, "routerLink"], ["name", "chevron-left", 3, "size"], ["role", "status", "aria-busy", "true", 1, "mt-4"], ["state", "empty", "title", "Registo n\xE3o encontrado", 1, "mt-6", "block", 3, "message"], ["state", "error", "title", "N\xE3o foi poss\xEDvel carregar o registo", 1, "mt-6", "block", 3, "message"], [1, "sr-only"], [1, "h-8", "w-64", "animate-pulse", "rounded-lg", "bg-ink-100"], [1, "mt-6", "rounded-xl", "bg-white", "p-6", "shadow-card", "ring-1", "ring-ink-950/6"], [1, "grid", "gap-6", "sm:grid-cols-2"], [1, "h-2.5", "w-20", "animate-pulse", "rounded-full", "bg-ink-100"], [1, "mt-2", "h-3.5", "w-40", "animate-pulse", "rounded-full", "bg-ink-100"], [1, "mt-4"], [1, "text-h2", "break-words", "text-ink-950"], [1, "mt-1", "text-body", "text-ink-500"], [1, "mt-6", "space-y-6"]], template: function DetailPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef();
      \u0275\u0275elementStart(0, "a", 0);
      \u0275\u0275element(1, "app-icon", 1);
      \u0275\u0275text(2);
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(3, DetailPage_Case_3_Template, 8, 1, "div", 2)(4, DetailPage_Case_4_Template, 1, 1, "app-state-panel", 3)(5, DetailPage_Case_5_Template, 1, 1, "app-state-panel", 4)(6, DetailPage_Case_6_Template, 6, 2);
    }
    if (rf & 2) {
      let tmp_3_0;
      \u0275\u0275property("routerLink", ctx.backLink());
      \u0275\u0275advance();
      \u0275\u0275property("size", 16);
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.backLabel(), "\n");
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_3_0 = ctx.status()) === "loading" ? 3 : tmp_3_0 === "missing" ? 4 : tmp_3_0 === "error" ? 5 : 6);
    }
  }, dependencies: [Icon, RouterLink, StatePanel], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DetailPage, [{
    type: Component,
    args: [{ selector: "app-detail-page", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon, RouterLink, StatePanel], host: { class: "block" }, template: `<a
  class="inline-flex items-center gap-1.5 rounded-sm text-meta font-semibold text-ink-500 transition-colors hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
  [routerLink]="backLink()"
>
  <app-icon name="chevron-left" [size]="16" />
  {{ backLabel() }}
</a>

@switch (status()) {
  @case ('loading') {
    <div class="mt-4" role="status" aria-busy="true">
      <span class="sr-only">A carregar\u2026</span>
      <div class="h-8 w-64 animate-pulse rounded-lg bg-ink-100"></div>
      <div class="mt-6 rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
        <div class="grid gap-6 sm:grid-cols-2">
          @for (row of [0, 1, 2, 3, 4, 5]; track row) {
            <div>
              <div class="h-2.5 w-20 animate-pulse rounded-full bg-ink-100"></div>
              <div class="mt-2 h-3.5 w-40 animate-pulse rounded-full bg-ink-100"></div>
            </div>
          }
        </div>
      </div>
    </div>
  }
  @case ('missing') {
    <app-state-panel
      class="mt-6 block"
      state="empty"
      title="Registo n\xE3o encontrado"
      [message]="missingMessage()"
    />
  }
  @case ('error') {
    <app-state-panel
      class="mt-6 block"
      state="error"
      title="N\xE3o foi poss\xEDvel carregar o registo"
      [message]="errorMessage()"
    />
  }
  @default {
    <header class="mt-4">
      <h1 class="text-h2 break-words text-ink-950">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="mt-1 text-body text-ink-500">{{ subtitle() }}</p>
      }
    </header>

    <div class="mt-6 space-y-6">
      <ng-content />
    </div>
  }
}
` }]
  }], null, { status: [{ type: Input, args: [{ isSignal: true, alias: "status", required: true }] }], title: [{ type: Input, args: [{ isSignal: true, alias: "title", required: true }] }], subtitle: [{ type: Input, args: [{ isSignal: true, alias: "subtitle", required: false }] }], backLink: [{ type: Input, args: [{ isSignal: true, alias: "backLink", required: true }] }], backLabel: [{ type: Input, args: [{ isSignal: true, alias: "backLabel", required: true }] }], errorMessage: [{ type: Input, args: [{ isSignal: true, alias: "errorMessage", required: false }] }], missingMessage: [{ type: Input, args: [{ isSignal: true, alias: "missingMessage", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DetailPage, { className: "DetailPage", filePath: "src/app/features/private/officegest/components/detail-page/detail-page.ts", lineNumber: 22 });
})();

// src/app/features/private/officegest/services/resource-detail.store.ts
function createResourceDetail(options) {
  const injector = options.injector ?? inject(Injector);
  const tick = signal(0, ...ngDevMode ? [{ debugName: "tick" }] : (
    /* istanbul ignore next */
    []
  ));
  const query = computed(() => ({ id: options.id(), tick: tick() }), ...ngDevMode ? [{ debugName: "query" }] : (
    /* istanbul ignore next */
    []
  ));
  const initial = { status: "loading", data: null, error: null };
  const view = toSignal(toObservable(query, { injector }).pipe(switchMap((current) => options.fetch(current.id).pipe(map((data) => ({ status: "ready", data, error: null })), catchError((error) => {
    const apiError = error instanceof ApiError ? error : new ApiError(0, "UNKNOWN", "N\xE3o foi poss\xEDvel carregar o registo.");
    return of({
      // A 404 is an answer, not a fault: the page shows "não
      // encontrado" rather than an error panel offering a retry that
      // cannot possibly help.
      status: apiError.status === 404 ? "missing" : "error",
      data: null,
      error: apiError
    });
  }), startWith(initial)))), { initialValue: initial, injector });
  return {
    data: computed(() => view().data),
    status: computed(() => view().status),
    error: computed(() => view().error),
    reload: () => tick.update((value) => value + 1)
  };
}

export {
  DetailList,
  DetailPage,
  createResourceDetail
};
//# sourceMappingURL=chunk-FHBZRBXP.js.map
