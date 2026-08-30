import {
  Icon
} from "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  NgTemplateOutlet,
  RouterLink,
  computed,
  input,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵreference,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-RUFDRP5X.js";

// src/app/shared/components/ui-button/ui-button.ts
var _c0 = ["*"];
function UiButton_ng_template_0_Conditional_0_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-icon", 4);
  }
  if (rf & 2) {
    const name_r1 = \u0275\u0275nextContext();
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("name", name_r1)("size", ctx_r1.iconSize());
  }
}
function UiButton_ng_template_0_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275conditionalCreate(0, UiButton_ng_template_0_Conditional_0_Conditional_0_Template, 1, 2, "app-icon", 4);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(ctx_r1.iconPosition() === "left" ? 0 : -1);
  }
}
function UiButton_ng_template_0_ProjectionFallback_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275textInterpolate(ctx_r1.resolvedLabel());
  }
}
function UiButton_ng_template_0_Conditional_4_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-icon", 5);
  }
  if (rf & 2) {
    const name_r3 = \u0275\u0275nextContext();
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("name", name_r3)("size", ctx_r1.iconSize());
  }
}
function UiButton_ng_template_0_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275conditionalCreate(0, UiButton_ng_template_0_Conditional_4_Conditional_0_Template, 1, 2, "app-icon", 5);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(ctx_r1.iconPosition() === "right" ? 0 : -1);
  }
}
function UiButton_ng_template_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275conditionalCreate(0, UiButton_ng_template_0_Conditional_0_Template, 1, 1);
    \u0275\u0275elementStart(1, "span");
    \u0275\u0275projection(2, 0, null, UiButton_ng_template_0_ProjectionFallback_2_Template, 1, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(4, UiButton_ng_template_0_Conditional_4_Template, 1, 1);
  }
  if (rf & 2) {
    let tmp_2_0;
    let tmp_3_0;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275conditional((tmp_2_0 = ctx_r1.resolvedIcon()) ? 0 : -1, tmp_2_0);
    \u0275\u0275advance(4);
    \u0275\u0275conditional((tmp_3_0 = ctx_r1.resolvedIcon()) ? 4 : -1, tmp_3_0);
  }
}
function UiButton_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 6);
    \u0275\u0275elementContainer(1, 7);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    const content_r4 = \u0275\u0275reference(1);
    \u0275\u0275classMap(ctx_r1.classes());
    \u0275\u0275property("routerLink", ctx)("fragment", ctx_r1.fragment());
    \u0275\u0275attribute("aria-label", ctx_r1.resolvedAriaLabel());
    \u0275\u0275advance();
    \u0275\u0275property("ngTemplateOutlet", content_r4);
  }
}
function UiButton_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 8);
    \u0275\u0275elementContainer(1, 7);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    const content_r4 = \u0275\u0275reference(1);
    \u0275\u0275classMap(ctx_r1.classes());
    \u0275\u0275property("href", ctx, \u0275\u0275sanitizeUrl);
    \u0275\u0275attribute("target", ctx_r1.resolvedExternal() ? "_blank" : null)("rel", ctx_r1.resolvedExternal() ? "noopener noreferrer" : null)("aria-label", ctx_r1.resolvedAriaLabel());
    \u0275\u0275advance();
    \u0275\u0275property("ngTemplateOutlet", content_r4);
  }
}
function UiButton_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "button", 9);
    \u0275\u0275elementContainer(1, 7);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    const content_r4 = \u0275\u0275reference(1);
    \u0275\u0275classMap(ctx_r1.classes());
    \u0275\u0275property("type", ctx_r1.type())("disabled", ctx_r1.disabled());
    \u0275\u0275attribute("aria-label", ctx_r1.resolvedAriaLabel());
    \u0275\u0275advance();
    \u0275\u0275property("ngTemplateOutlet", content_r4);
  }
}
var BASE = "group/btn relative inline-flex w-full items-center justify-center rounded-full font-semibold tracking-tight whitespace-nowrap select-none transition-[background-color,box-shadow,transform,color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none";
var VARIANTS = {
  primary: "bg-brand-600 text-white shadow-brand hover:-translate-y-0.5 hover:bg-brand-500 hover:shadow-brand-lg active:translate-y-0 active:bg-brand-700 active:shadow-brand focus-visible:outline-brand-600",
  secondary: (
    // A tinted alpha edge rather than flat grey: it keeps the white pill
    // defined against the warm bone background without looking drawn-on.
    "bg-white text-ink-900 shadow-btn ring-1 ring-ink-950/8 ring-inset hover:-translate-y-0.5 hover:shadow-btn-lg hover:ring-ink-950/16 active:translate-y-0 active:bg-bone-50 active:shadow-btn focus-visible:outline-ink-900"
  ),
  dark: "bg-ink-900 text-white shadow-btn hover:-translate-y-0.5 hover:bg-ink-800 hover:shadow-btn-lg active:translate-y-0 active:bg-ink-950 active:shadow-btn focus-visible:outline-ink-900",
  ghost: (
    // Sits on dark photography, so it leans on a frosted edge rather than fill.
    "bg-white/8 text-white ring-1 ring-white/20 ring-inset backdrop-blur-md hover:-translate-y-0.5 hover:bg-white/16 hover:ring-white/40 active:translate-y-0 active:bg-white/10 focus-visible:outline-white"
  ),
  link: "text-brand-700 underline decoration-brand-700/30 underline-offset-4 hover:text-brand-800 hover:decoration-brand-700/70 focus-visible:outline-brand-700"
};
var SIZES = {
  sm: "gap-2 px-4 py-2 text-sm",
  md: "gap-2.5 px-5 py-2.5 text-body",
  lg: "gap-3 px-7 py-3.5 text-lead"
};
var LINK_SIZES = {
  sm: "gap-1.5 text-sm",
  md: "gap-2 text-body",
  lg: "gap-2 text-lead"
};
var ICON_SIZES = { sm: 16, md: 18, lg: 20 };
var UiButton = class _UiButton {
  /** Convenience input: fills label, icon and destination from a data object. */
  action = input(null, ...ngDevMode ? [{ debugName: "action" }] : (
    /* istanbul ignore next */
    []
  ));
  variant = input("primary", ...ngDevMode ? [{ debugName: "variant" }] : (
    /* istanbul ignore next */
    []
  ));
  size = input("md", ...ngDevMode ? [{ debugName: "size" }] : (
    /* istanbul ignore next */
    []
  ));
  icon = input(null, ...ngDevMode ? [{ debugName: "icon" }] : (
    /* istanbul ignore next */
    []
  ));
  iconPosition = input("right", ...ngDevMode ? [{ debugName: "iconPosition" }] : (
    /* istanbul ignore next */
    []
  ));
  routerLink = input(null, ...ngDevMode ? [{ debugName: "routerLink" }] : (
    /* istanbul ignore next */
    []
  ));
  href = input(null, ...ngDevMode ? [{ debugName: "href" }] : (
    /* istanbul ignore next */
    []
  ));
  external = input(false, ...ngDevMode ? [{ debugName: "external" }] : (
    /* istanbul ignore next */
    []
  ));
  fragment = input(void 0, ...ngDevMode ? [{ debugName: "fragment" }] : (
    /* istanbul ignore next */
    []
  ));
  type = input("button", ...ngDevMode ? [{ debugName: "type" }] : (
    /* istanbul ignore next */
    []
  ));
  disabled = input(false, ...ngDevMode ? [{ debugName: "disabled" }] : (
    /* istanbul ignore next */
    []
  ));
  block = input(false, ...ngDevMode ? [{ debugName: "block" }] : (
    /* istanbul ignore next */
    []
  ));
  ariaLabel = input(null, ...ngDevMode ? [{ debugName: "ariaLabel" }] : (
    /* istanbul ignore next */
    []
  ));
  resolvedLabel = computed(() => this.action()?.label ?? "", ...ngDevMode ? [{ debugName: "resolvedLabel" }] : (
    /* istanbul ignore next */
    []
  ));
  resolvedIcon = computed(() => this.icon() ?? this.action()?.icon ?? null, ...ngDevMode ? [{ debugName: "resolvedIcon" }] : (
    /* istanbul ignore next */
    []
  ));
  resolvedRouterLink = computed(() => this.routerLink() ?? this.action()?.routerLink ?? null, ...ngDevMode ? [{ debugName: "resolvedRouterLink" }] : (
    /* istanbul ignore next */
    []
  ));
  resolvedHref = computed(() => this.href() ?? this.action()?.href ?? null, ...ngDevMode ? [{ debugName: "resolvedHref" }] : (
    /* istanbul ignore next */
    []
  ));
  resolvedExternal = computed(() => this.external() || !!this.action()?.external, ...ngDevMode ? [{ debugName: "resolvedExternal" }] : (
    /* istanbul ignore next */
    []
  ));
  resolvedAriaLabel = computed(() => this.ariaLabel() ?? this.action()?.ariaLabel ?? null, ...ngDevMode ? [{ debugName: "resolvedAriaLabel" }] : (
    /* istanbul ignore next */
    []
  ));
  iconSize = computed(() => ICON_SIZES[this.size()], ...ngDevMode ? [{ debugName: "iconSize" }] : (
    /* istanbul ignore next */
    []
  ));
  classes = computed(() => {
    const variant = this.variant();
    const sizing = variant === "link" ? LINK_SIZES : SIZES;
    return [BASE, VARIANTS[variant], sizing[this.size()]].join(" ");
  }, ...ngDevMode ? [{ debugName: "classes" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function UiButton_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _UiButton)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UiButton, selectors: [["app-button"]], hostVars: 2, hostBindings: function UiButton_HostBindings(rf, ctx) {
    if (rf & 2) {
      \u0275\u0275classProp("w-full", ctx.block());
    }
  }, inputs: { action: [1, "action"], variant: [1, "variant"], size: [1, "size"], icon: [1, "icon"], iconPosition: [1, "iconPosition"], routerLink: [1, "routerLink"], href: [1, "href"], external: [1, "external"], fragment: [1, "fragment"], type: [1, "type"], disabled: [1, "disabled"], block: [1, "block"], ariaLabel: [1, "ariaLabel"] }, ngContentSelectors: _c0, decls: 5, vars: 1, consts: [["content", ""], [3, "routerLink", "fragment", "class"], [3, "href", "class"], [3, "type", "class", "disabled"], [3, "name", "size"], [1, "transition-transform", "duration-200", "group-hover/btn:translate-x-0.5", 3, "name", "size"], [3, "routerLink", "fragment"], [3, "ngTemplateOutlet"], [3, "href"], [3, "type", "disabled"]], template: function UiButton_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef();
      \u0275\u0275template(0, UiButton_ng_template_0_Template, 5, 2, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
      \u0275\u0275conditionalCreate(2, UiButton_Conditional_2_Template, 2, 6, "a", 1)(3, UiButton_Conditional_3_Template, 2, 7, "a", 2)(4, UiButton_Conditional_4_Template, 2, 6, "button", 3);
    }
    if (rf & 2) {
      let tmp_1_0;
      \u0275\u0275advance(2);
      \u0275\u0275conditional((tmp_1_0 = ctx.resolvedRouterLink()) ? 2 : (tmp_1_0 = ctx.resolvedHref()) ? 3 : 4, tmp_1_0);
    }
  }, dependencies: [NgTemplateOutlet, RouterLink, Icon], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UiButton, [{
    type: Component,
    args: [{ selector: "app-button", changeDetection: ChangeDetectionStrategy.OnPush, imports: [NgTemplateOutlet, RouterLink, Icon], host: {
      // The default display lives in the base layer (see styles.css) rather than
      // in a host class: an element selector loses to any utility, so a consumer
      // writing `class="hidden lg:inline-flex"` still wins. A static host class
      // would have the same specificity as `hidden` and be decided by source
      // order — which is how the header CTA leaked onto mobile.
      "[class.w-full]": "block()"
    }, template: `<!--
  One template, three possible host elements. Only one branch is ever
  instantiated, so the projected content template is used exactly once.
-->
<ng-template #content>
  @if (resolvedIcon(); as name) {
    @if (iconPosition() === 'left') {
      <app-icon [name]="name" [size]="iconSize()" />
    }
  }
  <span
    ><ng-content>{{ resolvedLabel() }}</ng-content></span
  >
  @if (resolvedIcon(); as name) {
    @if (iconPosition() === 'right') {
      <app-icon
        [name]="name"
        [size]="iconSize()"
        class="transition-transform duration-200 group-hover/btn:translate-x-0.5"
      />
    }
  }
</ng-template>

@if (resolvedRouterLink(); as link) {
  <a [routerLink]="link" [fragment]="fragment()" [class]="classes()" [attr.aria-label]="resolvedAriaLabel()">
    <ng-container [ngTemplateOutlet]="content" />
  </a>
} @else if (resolvedHref(); as url) {
  <a
    [href]="url"
    [class]="classes()"
    [attr.target]="resolvedExternal() ? '_blank' : null"
    [attr.rel]="resolvedExternal() ? 'noopener noreferrer' : null"
    [attr.aria-label]="resolvedAriaLabel()"
  >
    <ng-container [ngTemplateOutlet]="content" />
  </a>
} @else {
  <button [type]="type()" [class]="classes()" [disabled]="disabled()" [attr.aria-label]="resolvedAriaLabel()">
    <ng-container [ngTemplateOutlet]="content" />
  </button>
}
` }]
  }], null, { action: [{ type: Input, args: [{ isSignal: true, alias: "action", required: false }] }], variant: [{ type: Input, args: [{ isSignal: true, alias: "variant", required: false }] }], size: [{ type: Input, args: [{ isSignal: true, alias: "size", required: false }] }], icon: [{ type: Input, args: [{ isSignal: true, alias: "icon", required: false }] }], iconPosition: [{ type: Input, args: [{ isSignal: true, alias: "iconPosition", required: false }] }], routerLink: [{ type: Input, args: [{ isSignal: true, alias: "routerLink", required: false }] }], href: [{ type: Input, args: [{ isSignal: true, alias: "href", required: false }] }], external: [{ type: Input, args: [{ isSignal: true, alias: "external", required: false }] }], fragment: [{ type: Input, args: [{ isSignal: true, alias: "fragment", required: false }] }], type: [{ type: Input, args: [{ isSignal: true, alias: "type", required: false }] }], disabled: [{ type: Input, args: [{ isSignal: true, alias: "disabled", required: false }] }], block: [{ type: Input, args: [{ isSignal: true, alias: "block", required: false }] }], ariaLabel: [{ type: Input, args: [{ isSignal: true, alias: "ariaLabel", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UiButton, { className: "UiButton", filePath: "src/app/shared/components/ui-button/ui-button.ts", lineNumber: 95 });
})();

export {
  UiButton
};
//# sourceMappingURL=chunk-NGHYTC22.js.map
