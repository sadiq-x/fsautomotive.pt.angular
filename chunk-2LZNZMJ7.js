import {
  UiButton
} from "./chunk-NGHYTC22.js";
import {
  Icon
} from "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  computed,
  input,
  output,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/officegest/utils/format.ts
var LOCALE = "pt-PT";
function formatDate(iso) {
  const date = parse(iso);
  return date ? date.toLocaleDateString(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric" }) : null;
}
function formatDateTime(iso) {
  const date = parse(iso);
  return date ? date.toLocaleString(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) : null;
}
function formatCurrency(value) {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString(LOCALE, { style: "currency", currency: "EUR" }) : null;
}
function formatMileage(value) {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString(LOCALE)} km` : null;
}
function formatPlate(plate) {
  if (!plate) {
    return null;
  }
  return /^[A-Z0-9]{6}$/i.test(plate) ? `${plate.slice(0, 2)}-${plate.slice(2, 4)}-${plate.slice(4, 6)}`.toUpperCase() : plate.toUpperCase();
}
function orNull(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
function formatActive(active) {
  return active === void 0 ? null : active ? "Ativo" : "Inativo";
}
function parse(iso) {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

// src/app/features/private/officegest/components/status-badge/status-badge.ts
var TONES = {
  neutral: "bg-ink-100 text-ink-700 ring-ink-950/8",
  positive: "bg-emerald-50 text-emerald-800 ring-emerald-700/15",
  warning: "bg-amber-50 text-amber-900 ring-amber-700/20",
  critical: "bg-brand-50 text-brand-800 ring-brand-700/15",
  info: "bg-sky-50 text-sky-800 ring-sky-700/15"
};
var TONE_PATTERNS = [
  ["positive", /(conclu|fechad|closed|final|entregue|pago|paid|ativ|activ|complete)/i],
  ["warning", /(pendente|pending|aguard|waiting|espera|aberto|open|em curso|progress)/i],
  ["critical", /(cancel|anulad|erro|error|rejeit|reject|inativ|inactiv)/i],
  ["info", /(agendad|scheduled|marcad|novo|new|orcament|budget)/i]
];
var StatusBadge = class _StatusBadge {
  label = input.required(...ngDevMode ? [{ debugName: "label" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Overrides the inferred tone when a page knows better. */
  tone = input(null, ...ngDevMode ? [{ debugName: "tone" }] : (
    /* istanbul ignore next */
    []
  ));
  resolvedTone = computed(() => {
    const explicit = this.tone();
    if (explicit) {
      return explicit;
    }
    const label = this.label();
    return TONE_PATTERNS.find(([, pattern]) => pattern.test(label))?.[0] ?? "neutral";
  }, ...ngDevMode ? [{ debugName: "resolvedTone" }] : (
    /* istanbul ignore next */
    []
  ));
  classes = computed(() => [
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-meta font-semibold",
    "ring-1 ring-inset whitespace-nowrap",
    TONES[this.resolvedTone()]
  ].join(" "), ...ngDevMode ? [{ debugName: "classes" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function StatusBadge_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _StatusBadge)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _StatusBadge, selectors: [["app-status-badge"]], hostAttrs: [1, "inline-flex"], inputs: { label: [1, "label"], tone: [1, "tone"] }, decls: 2, vars: 3, template: function StatusBadge_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275domElementStart(0, "span");
      \u0275\u0275text(1);
      \u0275\u0275domElementEnd();
    }
    if (rf & 2) {
      \u0275\u0275classMap(ctx.classes());
      \u0275\u0275advance();
      \u0275\u0275textInterpolate(ctx.label());
    }
  }, encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(StatusBadge, [{
    type: Component,
    args: [{
      selector: "app-status-badge",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<span [class]="classes()">{{ label() }}</span>`,
      host: { class: "inline-flex" }
    }]
  }], null, { label: [{ type: Input, args: [{ isSignal: true, alias: "label", required: true }] }], tone: [{ type: Input, args: [{ isSignal: true, alias: "tone", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(StatusBadge, { className: "StatusBadge", filePath: "src/app/features/private/officegest/components/status-badge/status-badge.ts", lineNumber: 36 });
})();

// src/app/features/private/officegest/components/state-panel/state-panel.ts
function StatePanel_Case_0_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3);
    \u0275\u0275element(1, "div", 4)(2, "div", 5)(3, "div", 6);
    \u0275\u0275elementEnd();
  }
}
function StatePanel_Case_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0)(1, "span", 2);
    \u0275\u0275text(2, "A carregar\u2026");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(3, StatePanel_Case_0_For_4_Template, 4, 0, "div", 3, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r0.skeletons());
  }
}
function StatePanel_Case_1_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 9);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.message());
  }
}
function StatePanel_Case_1_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-button", 11);
    \u0275\u0275listener("click", function StatePanel_Case_1_Conditional_6_Template_app_button_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.action.emit());
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx, " ");
  }
}
function StatePanel_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1)(1, "span");
    \u0275\u0275element(2, "app-icon", 7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 8);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(5, StatePanel_Case_1_Conditional_5_Template, 2, 1, "p", 9);
    \u0275\u0275conditionalCreate(6, StatePanel_Case_1_Conditional_6_Template, 2, 1, "app-button", 10);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_6_0;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275classMap("flex size-12 items-center justify-center rounded-full " + (ctx_r0.state() === "error" ? "bg-brand-50 text-brand-700" : "bg-ink-50 text-ink-400"));
    \u0275\u0275advance();
    \u0275\u0275property("name", ctx_r0.icon())("size", 24);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.title());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r0.message() ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_6_0 = ctx_r0.actionLabel()) ? 6 : -1, tmp_6_0);
  }
}
var StatePanel = class _StatePanel {
  state = input.required(...ngDevMode ? [{ debugName: "state" }] : (
    /* istanbul ignore next */
    []
  ));
  title = input(null, ...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  message = input(null, ...ngDevMode ? [{ debugName: "message" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Label for the recovery action. Omit to render no button. */
  actionLabel = input(null, ...ngDevMode ? [{ debugName: "actionLabel" }] : (
    /* istanbul ignore next */
    []
  ));
  /** How many skeleton rows to draw; match the page size where it is known. */
  skeletonRows = input(6, ...ngDevMode ? [{ debugName: "skeletonRows" }] : (
    /* istanbul ignore next */
    []
  ));
  action = output();
  icon = computed(() => this.state() === "error" ? "alert-triangle" : "inbox", ...ngDevMode ? [{ debugName: "icon" }] : (
    /* istanbul ignore next */
    []
  ));
  skeletons = computed(() => Array.from({ length: this.skeletonRows() }, (_, index) => index), ...ngDevMode ? [{ debugName: "skeletons" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function StatePanel_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _StatePanel)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _StatePanel, selectors: [["app-state-panel"]], hostAttrs: [1, "block"], inputs: { state: [1, "state"], title: [1, "title"], message: [1, "message"], actionLabel: [1, "actionLabel"], skeletonRows: [1, "skeletonRows"] }, outputs: { action: "action" }, decls: 2, vars: 1, consts: [["role", "status", "aria-busy", "true", 1, "space-y-2"], ["role", "status", 1, "flex", "flex-col", "items-center", "rounded-xl", "bg-white", "px-6", "py-14", "text-center", "ring-1", "ring-ink-950/6"], [1, "sr-only"], [1, "flex", "items-center", "gap-4", "rounded-lg", "bg-white", "px-4", "py-4", "ring-1", "ring-ink-950/6"], [1, "h-3", "w-1/4", "animate-pulse", "rounded-full", "bg-ink-100"], [1, "h-3", "w-1/3", "animate-pulse", "rounded-full", "bg-ink-100"], [1, "ml-auto", "h-3", "w-16", "animate-pulse", "rounded-full", "bg-ink-100"], [3, "name", "size"], [1, "mt-4", "text-h3", "text-ink-900"], [1, "mt-2", "max-w-md", "text-body", "text-ink-500"], ["variant", "secondary", "icon", "refresh", "iconPosition", "left", 1, "mt-6"], ["variant", "secondary", "icon", "refresh", "iconPosition", "left", 1, "mt-6", 3, "click"]], template: function StatePanel_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275conditionalCreate(0, StatePanel_Case_0_Template, 5, 0, "div", 0)(1, StatePanel_Case_1_Template, 7, 7, "div", 1);
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275conditional((tmp_0_0 = ctx.state()) === "loading" ? 0 : 1);
    }
  }, dependencies: [Icon, UiButton], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(StatePanel, [{
    type: Component,
    args: [{ selector: "app-state-panel", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon, UiButton], host: { class: "block" }, template: `@switch (state()) {
  @case ('loading') {
    <!-- Skeletons reserve the row height so nothing jumps when data lands. -->
    <div class="space-y-2" role="status" aria-busy="true">
      <span class="sr-only">A carregar\u2026</span>
      @for (row of skeletons(); track row) {
        <div class="flex items-center gap-4 rounded-lg bg-white px-4 py-4 ring-1 ring-ink-950/6">
          <div class="h-3 w-1/4 animate-pulse rounded-full bg-ink-100"></div>
          <div class="h-3 w-1/3 animate-pulse rounded-full bg-ink-100"></div>
          <div class="ml-auto h-3 w-16 animate-pulse rounded-full bg-ink-100"></div>
        </div>
      }
    </div>
  }
  @default {
    <div
      role="status"
      class="flex flex-col items-center rounded-xl bg-white px-6 py-14 text-center ring-1 ring-ink-950/6"
    >
      <span
        [class]="
          'flex size-12 items-center justify-center rounded-full ' +
          (state() === 'error' ? 'bg-brand-50 text-brand-700' : 'bg-ink-50 text-ink-400')
        "
      >
        <app-icon [name]="icon()" [size]="24" />
      </span>

      <p class="mt-4 text-h3 text-ink-900">{{ title() }}</p>

      @if (message()) {
        <p class="mt-2 max-w-md text-body text-ink-500">{{ message() }}</p>
      }

      @if (actionLabel(); as label) {
        <app-button
          class="mt-6"
          variant="secondary"
          icon="refresh"
          iconPosition="left"
          (click)="action.emit()"
        >
          {{ label }}
        </app-button>
      }
    </div>
  }
}
` }]
  }], null, { state: [{ type: Input, args: [{ isSignal: true, alias: "state", required: true }] }], title: [{ type: Input, args: [{ isSignal: true, alias: "title", required: false }] }], message: [{ type: Input, args: [{ isSignal: true, alias: "message", required: false }] }], actionLabel: [{ type: Input, args: [{ isSignal: true, alias: "actionLabel", required: false }] }], skeletonRows: [{ type: Input, args: [{ isSignal: true, alias: "skeletonRows", required: false }] }], action: [{ type: Output, args: ["action"] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(StatePanel, { className: "StatePanel", filePath: "src/app/features/private/officegest/components/state-panel/state-panel.ts", lineNumber: 32 });
})();

export {
  StatusBadge,
  StatePanel,
  formatDate,
  formatDateTime,
  formatCurrency,
  formatMileage,
  formatPlate,
  orNull,
  formatActive
};
//# sourceMappingURL=chunk-2LZNZMJ7.js.map
