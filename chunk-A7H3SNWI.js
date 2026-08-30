import {
  LightboxService,
  ResponsiveImage
} from "./chunk-AL2QOPM3.js";
import {
  UiButton
} from "./chunk-NGHYTC22.js";
import {
  CALL_ACTION,
  DIRECTIONS_ACTION,
  SITE
} from "./chunk-UVBD33FH.js";
import {
  Icon
} from "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  Input,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  setClassMetadata,
  signal,
  ɵsetClassDebugInfo,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdomElement,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵdomProperty,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵstyleProp,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-RUFDRP5X.js";

// src/app/shared/components/accordion/accordion-state.ts
var AccordionState = class _AccordionState {
  openIds = signal(/* @__PURE__ */ new Set(), ...ngDevMode ? [{ debugName: "openIds" }] : (
    /* istanbul ignore next */
    []
  ));
  multiple = signal(false, ...ngDevMode ? [{ debugName: "multiple" }] : (
    /* istanbul ignore next */
    []
  ));
  openCount = computed(() => this.openIds().size, ...ngDevMode ? [{ debugName: "openCount" }] : (
    /* istanbul ignore next */
    []
  ));
  isOpen(id) {
    return this.openIds().has(id);
  }
  toggle(id) {
    const current = this.openIds();
    if (current.has(id)) {
      const next = new Set(current);
      next.delete(id);
      this.openIds.set(next);
      return;
    }
    this.openIds.set(this.multiple() ? new Set(current).add(id) : /* @__PURE__ */ new Set([id]));
  }
  closeAll() {
    this.openIds.set(/* @__PURE__ */ new Set());
  }
  static \u0275fac = function AccordionState_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AccordionState)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AccordionState, factory: _AccordionState.\u0275fac });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AccordionState, [{
    type: Injectable
  }], null, null);
})();

// src/app/shared/components/accordion/accordion.ts
var _c0 = ["*"];
var Accordion = class _Accordion {
  /** Allow several panels to stay open at the same time. */
  multiple = input(false, ...ngDevMode ? [{ debugName: "multiple" }] : (
    /* istanbul ignore next */
    []
  ));
  state = inject(AccordionState);
  constructor() {
    effect(() => this.state.multiple.set(this.multiple()));
  }
  static \u0275fac = function Accordion_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Accordion)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Accordion, selectors: [["app-accordion"]], hostAttrs: [1, "block", "divide-y", "divide-ink-200/70"], inputs: { multiple: [1, "multiple"] }, features: [\u0275\u0275ProvidersFeature([AccordionState])], ngContentSelectors: _c0, decls: 1, vars: 0, template: function Accordion_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef();
      \u0275\u0275projection(0);
    }
  }, encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Accordion, [{
    type: Component,
    args: [{
      selector: "app-accordion",
      changeDetection: ChangeDetectionStrategy.OnPush,
      providers: [AccordionState],
      template: `<ng-content />`,
      host: { class: "block divide-y divide-ink-200/70" }
    }]
  }], () => [], { multiple: [{ type: Input, args: [{ isSignal: true, alias: "multiple", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Accordion, { className: "Accordion", filePath: "src/app/shared/components/accordion/accordion.ts", lineNumber: 20 });
})();

// src/app/shared/components/accordion/accordion-item.ts
var _c02 = ["*"];
function AccordionItem_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 9);
    \u0275\u0275element(1, "app-icon", 10);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classMap(ctx_r0.open() ? "bg-brand-600 text-white" : "bg-bone-200 text-ink-700 group-hover:bg-brand-50 group-hover:text-brand-600");
    \u0275\u0275advance();
    \u0275\u0275property("name", ctx)("size", 22);
  }
}
function AccordionItem_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 4);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
var AccordionItem = class _AccordionItem {
  itemId = input.required(...ngDevMode ? [{ debugName: "itemId" }] : (
    /* istanbul ignore next */
    []
  ));
  title = input.required(...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  summary = input(null, ...ngDevMode ? [{ debugName: "summary" }] : (
    /* istanbul ignore next */
    []
  ));
  icon = input(null, ...ngDevMode ? [{ debugName: "icon" }] : (
    /* istanbul ignore next */
    []
  ));
  state = inject(AccordionState);
  open = computed(() => this.state.isOpen(this.itemId()), ...ngDevMode ? [{ debugName: "open" }] : (
    /* istanbul ignore next */
    []
  ));
  panelId = computed(() => `accordion-panel-${this.itemId()}`, ...ngDevMode ? [{ debugName: "panelId" }] : (
    /* istanbul ignore next */
    []
  ));
  headerId = computed(() => `accordion-header-${this.itemId()}`, ...ngDevMode ? [{ debugName: "headerId" }] : (
    /* istanbul ignore next */
    []
  ));
  panelClasses = computed(() => [
    "pb-6 transition-opacity duration-300",
    this.open() ? "opacity-100" : "opacity-0",
    this.icon() ? "pl-1 sm:pl-18" : "pl-1"
  ].join(" "), ...ngDevMode ? [{ debugName: "panelClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  toggle() {
    this.state.toggle(this.itemId());
  }
  static \u0275fac = function AccordionItem_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AccordionItem)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AccordionItem, selectors: [["app-accordion-item"]], hostAttrs: [1, "block"], inputs: { itemId: [1, "itemId"], title: [1, "title"], summary: [1, "summary"], icon: [1, "icon"] }, ngContentSelectors: _c02, decls: 13, vars: 19, consts: [["type", "button", 1, "group", "flex", "w-full", "cursor-pointer", "items-center", "gap-4", "px-1", "py-5", "text-left", "transition-colors", "duration-200", "sm:gap-5", "sm:px-2", 3, "click", "id"], [1, "inline-flex", "size-11", "shrink-0", "items-center", "justify-center", "rounded-xl", "transition-colors", "duration-300", 3, "class"], [1, "min-w-0", "flex-1"], [1, "block", "text-h3", "font-bold", "transition-colors", "duration-200"], [1, "mt-1", "block", "text-body", "text-ink-500"], ["aria-hidden", "true", 1, "inline-flex", "size-9", "shrink-0", "items-center", "justify-center", "rounded-full", "transition-all", "duration-300"], ["name", "chevron-down", 3, "size", "strokeWidth"], ["role", "region", 1, "grid", "transition-[grid-template-rows]", "duration-350", "ease-out", 3, "id"], [1, "overflow-hidden"], [1, "inline-flex", "size-11", "shrink-0", "items-center", "justify-center", "rounded-xl", "transition-colors", "duration-300"], [3, "name", "size"]], template: function AccordionItem_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef();
      \u0275\u0275elementStart(0, "h3")(1, "button", 0);
      \u0275\u0275listener("click", function AccordionItem_Template_button_click_1_listener() {
        return ctx.toggle();
      });
      \u0275\u0275conditionalCreate(2, AccordionItem_Conditional_2_Template, 2, 4, "span", 1);
      \u0275\u0275elementStart(3, "span", 2)(4, "span", 3);
      \u0275\u0275text(5);
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(6, AccordionItem_Conditional_6_Template, 2, 1, "span", 4);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "span", 5);
      \u0275\u0275element(8, "app-icon", 6);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(9, "div", 7)(10, "div", 8)(11, "div");
      \u0275\u0275projection(12);
      \u0275\u0275elementEnd()()();
    }
    if (rf & 2) {
      let tmp_3_0;
      let tmp_6_0;
      \u0275\u0275advance();
      \u0275\u0275property("id", ctx.headerId());
      \u0275\u0275attribute("aria-expanded", ctx.open())("aria-controls", ctx.panelId());
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_3_0 = ctx.icon()) ? 2 : -1, tmp_3_0);
      \u0275\u0275advance(2);
      \u0275\u0275classMap(ctx.open() ? "text-brand-600" : "text-ink-950 group-hover:text-brand-600");
      \u0275\u0275advance();
      \u0275\u0275textInterpolate(ctx.title());
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_6_0 = ctx.summary()) ? 6 : -1, tmp_6_0);
      \u0275\u0275advance();
      \u0275\u0275classMap(ctx.open() ? "rotate-180 bg-brand-600 text-white shadow-brand" : "bg-bone-100 text-ink-600 ring-1 ring-ink-950/6 ring-inset group-hover:bg-ink-950 group-hover:text-white group-hover:ring-ink-950");
      \u0275\u0275advance();
      \u0275\u0275property("size", 18)("strokeWidth", 2.25);
      \u0275\u0275advance();
      \u0275\u0275classMap(ctx.open() ? "grid-rows-[1fr]" : "grid-rows-[0fr]");
      \u0275\u0275property("id", ctx.panelId());
      \u0275\u0275attribute("aria-labelledby", ctx.headerId())("inert", ctx.open() ? null : "");
      \u0275\u0275advance(2);
      \u0275\u0275classMap(ctx.panelClasses());
    }
  }, dependencies: [Icon], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AccordionItem, [{
    type: Component,
    args: [{ selector: "app-accordion-item", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon], host: { class: "block" }, template: `<h3>
  <button
    type="button"
    [id]="headerId()"
    [attr.aria-expanded]="open()"
    [attr.aria-controls]="panelId()"
    (click)="toggle()"
    class="group flex w-full cursor-pointer items-center gap-4 px-1 py-5 text-left transition-colors duration-200 sm:gap-5 sm:px-2"
  >
    @if (icon(); as name) {
      <span
        class="inline-flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-300"
        [class]="
          open()
            ? 'bg-brand-600 text-white'
            : 'bg-bone-200 text-ink-700 group-hover:bg-brand-50 group-hover:text-brand-600'
        "
      >
        <app-icon [name]="name" [size]="22" />
      </span>
    }

    <span class="min-w-0 flex-1">
      <span
        class="block text-h3 font-bold transition-colors duration-200"
        [class]="open() ? 'text-brand-600' : 'text-ink-950 group-hover:text-brand-600'"
        >{{ title() }}</span
      >
      @if (summary(); as text) {
        <span class="mt-1 block text-body text-ink-500">{{ text }}</span>
      }
    </span>

    <span
      class="inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-300"
      [class]="
        open()
          ? 'rotate-180 bg-brand-600 text-white shadow-brand'
          : 'bg-bone-100 text-ink-600 ring-1 ring-ink-950/6 ring-inset group-hover:bg-ink-950 group-hover:text-white group-hover:ring-ink-950'
      "
      aria-hidden="true"
    >
      <app-icon name="chevron-down" [size]="18" [strokeWidth]="2.25" />
    </span>
  </button>
</h3>

<div
  [id]="panelId()"
  role="region"
  [attr.aria-labelledby]="headerId()"
  class="grid transition-[grid-template-rows] duration-350 ease-out"
  [class]="open() ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
  [attr.inert]="open() ? null : ''"
>
  <div class="overflow-hidden">
    <div [class]="panelClasses()">
      <ng-content />
    </div>
  </div>
</div>
` }]
  }], null, { itemId: [{ type: Input, args: [{ isSignal: true, alias: "itemId", required: true }] }], title: [{ type: Input, args: [{ isSignal: true, alias: "title", required: true }] }], summary: [{ type: Input, args: [{ isSignal: true, alias: "summary", required: false }] }], icon: [{ type: Input, args: [{ isSignal: true, alias: "icon", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AccordionItem, { className: "AccordionItem", filePath: "src/app/shared/components/accordion/accordion-item.ts", lineNumber: 19 });
})();

// src/app/shared/components/contact-channels/contact-channels.ts
var _forTrack0 = ($index, $item) => $item.label;
function ContactChannels_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 0)(1, "a", 1)(2, "span", 2);
    \u0275\u0275element(3, "app-icon", 3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 4)(5, "span", 5);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 6);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "span", 7);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275element(11, "app-icon", 8);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const channel_r1 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("href", channel_r1.href, \u0275\u0275sanitizeUrl);
    \u0275\u0275attribute("target", channel_r1.external ? "_blank" : null)("rel", channel_r1.external ? "noopener noreferrer" : null);
    \u0275\u0275advance(2);
    \u0275\u0275property("name", channel_r1.icon)("size", 22);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(channel_r1.label);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(channel_r1.value);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(channel_r1.hint);
    \u0275\u0275advance();
    \u0275\u0275property("size", 18);
  }
}
var ContactChannels = class _ContactChannels {
  layout = input("grid", ...ngDevMode ? [{ debugName: "layout" }] : (
    /* istanbul ignore next */
    []
  ));
  channels = [
    {
      icon: "phone",
      label: "Telefone",
      value: SITE.phone.display,
      href: SITE.phone.href,
      external: false,
      hint: "Fale connosco durante o hor\xE1rio de funcionamento"
    },
    {
      icon: "mail",
      label: "E-mail",
      value: SITE.email,
      href: `mailto:${SITE.email}`,
      external: false,
      hint: "Respondemos normalmente no mesmo dia \xFAtil"
    },
    {
      icon: "map-pin",
      label: "Morada",
      value: `${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.city}`,
      href: SITE.address.directionsUrl,
      external: true,
      hint: "Abrir dire\xE7\xF5es no Google Maps"
    }
  ];
  listClasses = computed(() => this.layout() === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4", ...ngDevMode ? [{ debugName: "listClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function ContactChannels_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ContactChannels)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ContactChannels, selectors: [["app-contact-channels"]], hostAttrs: [1, "block"], inputs: { layout: [1, "layout"] }, decls: 3, vars: 2, consts: [[1, "min-w-0"], [1, "group", "relative", "flex", "h-full", "items-start", "gap-4", "rounded-2xl", "bg-white", "p-6", "shadow-card", "transition-all", "duration-300", "ease-out", "hover:-translate-y-1", "hover:shadow-card-hover", 3, "href"], [1, "grid", "size-12", "shrink-0", "place-items-center", "rounded-xl", "bg-brand-50", "text-brand-600", "transition-colors", "duration-300", "group-hover:bg-brand-600", "group-hover:text-white"], [3, "name", "size"], [1, "min-w-0", "flex-1"], [1, "block", "text-eyebrow", "text-ink-400", "uppercase"], [1, "mt-1.5", "block", "text-body", "font-bold", "wrap-anywhere", "text-ink-950", "transition-colors", "duration-200", "group-hover:text-brand-600"], [1, "mt-1.5", "block", "text-meta", "text-ink-500"], ["name", "arrow-up-right", 1, "absolute", "top-5", "right-5", "text-ink-300", "transition-all", "duration-200", "group-hover:translate-x-0.5", "group-hover:-translate-y-0.5", "group-hover:text-brand-600", 3, "size"]], template: function ContactChannels_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "ul");
      \u0275\u0275repeaterCreate(1, ContactChannels_For_2_Template, 12, 9, "li", 0, _forTrack0);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275classMap(ctx.listClasses());
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.channels);
    }
  }, dependencies: [Icon], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ContactChannels, [{
    type: Component,
    args: [{ selector: "app-contact-channels", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon], host: { class: "block" }, template: `<ul [class]="listClasses()">
  @for (channel of channels; track channel.label) {
    <li class="min-w-0">
      <a
        [href]="channel.href"
        [attr.target]="channel.external ? '_blank' : null"
        [attr.rel]="channel.external ? 'noopener noreferrer' : null"
        class="group relative flex h-full items-start gap-4 rounded-2xl bg-white p-6 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-card-hover"
      >
        <span
          class="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white"
        >
          <app-icon [name]="channel.icon" [size]="22" />
        </span>

        <span class="min-w-0 flex-1">
          <span class="block text-eyebrow text-ink-400 uppercase">{{ channel.label }}</span>
          <span
            class="mt-1.5 block text-body font-bold wrap-anywhere text-ink-950 transition-colors duration-200 group-hover:text-brand-600"
            >{{ channel.value }}</span
          >
          <span class="mt-1.5 block text-meta text-ink-500">{{ channel.hint }}</span>
        </span>

        <app-icon
          name="arrow-up-right"
          [size]="18"
          class="absolute top-5 right-5 text-ink-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600"
        />
      </a>
    </li>
  }
</ul>
` }]
  }], null, { layout: [{ type: Input, args: [{ isSignal: true, alias: "layout", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ContactChannels, { className: "ContactChannels", filePath: "src/app/shared/components/contact-channels/contact-channels.ts", lineNumber: 27 });
})();

// src/app/shared/components/carousel/carousel.ts
var _forTrack02 = ($index, $item) => $item.src;
function Carousel_For_3_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "figcaption", 4);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const slide_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", slide_r1.caption, " ");
  }
}
function Carousel_For_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "figure", 2);
    \u0275\u0275element(1, "app-responsive-image", 3);
    \u0275\u0275conditionalCreate(2, Carousel_For_3_Conditional_2_Template, 2, 1, "figcaption", 4);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const slide_r1 = ctx.$implicit;
    const $index_r2 = ctx.$index;
    const \u0275$index_5_r3 = ctx.$index;
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275attribute("aria-label", $index_r2 + 1 + " de " + ctx_r3.count())("aria-hidden", ctx_r3.current() !== $index_r2 ? "true" : null);
    \u0275\u0275advance();
    \u0275\u0275property("image", slide_r1)("priority", ctx_r3.eager() && \u0275$index_5_r3 === 0);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r3.showCaptions() && slide_r1.caption ? 2 : -1);
  }
}
function Carousel_Conditional_4_For_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 11);
    \u0275\u0275listener("click", function Carousel_Conditional_4_For_6_Template_button_click_0_listener() {
      const $index_r7 = \u0275\u0275restoreView(_r6).$index;
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.goTo($index_r7));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const $index_r7 = ctx.$index;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275classMap(ctx_r3.current() === $index_r7 ? "w-8 bg-brand-600" : "w-4 bg-white/50 hover:bg-white/80");
    \u0275\u0275attribute("aria-label", "Ir para a fotografia " + ($index_r7 + 1))("aria-current", ctx_r3.current() === $index_r7 ? "true" : null);
  }
}
function Carousel_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 5);
    \u0275\u0275listener("click", function Carousel_Conditional_4_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.previous());
    });
    \u0275\u0275element(1, "app-icon", 6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "button", 7);
    \u0275\u0275listener("click", function Carousel_Conditional_4_Template_button_click_2_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.next());
    });
    \u0275\u0275element(3, "app-icon", 8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 9);
    \u0275\u0275repeaterCreate(5, Carousel_Conditional_4_For_6_Template, 1, 4, "button", 10, _forTrack02);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("size", 20)("strokeWidth", 2.25);
    \u0275\u0275advance(2);
    \u0275\u0275property("size", 20)("strokeWidth", 2.25);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r3.slides());
  }
}
var Carousel = class _Carousel {
  slides = input.required(...ngDevMode ? [{ debugName: "slides" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Milliseconds between automatic transitions. */
  interval = input(5e3, ...ngDevMode ? [{ debugName: "interval" }] : (
    /* istanbul ignore next */
    []
  ));
  autoplay = input(true, ...ngDevMode ? [{ debugName: "autoplay" }] : (
    /* istanbul ignore next */
    []
  ));
  showControls = input(true, ...ngDevMode ? [{ debugName: "showControls" }] : (
    /* istanbul ignore next */
    []
  ));
  showCaptions = input(false, ...ngDevMode ? [{ debugName: "showCaptions" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Marks the first slide as LCP-critical so it is fetched eagerly. */
  eager = input(true, ...ngDevMode ? [{ debugName: "eager" }] : (
    /* istanbul ignore next */
    []
  ));
  destroyRef = inject(DestroyRef);
  paused = signal(false, ...ngDevMode ? [{ debugName: "paused" }] : (
    /* istanbul ignore next */
    []
  ));
  timer = null;
  current = signal(0, ...ngDevMode ? [{ debugName: "current" }] : (
    /* istanbul ignore next */
    []
  ));
  count = computed(() => this.slides().length, ...ngDevMode ? [{ debugName: "count" }] : (
    /* istanbul ignore next */
    []
  ));
  trackStyle = computed(() => `translate3d(-${this.current() * 100}%, 0, 0)`, ...ngDevMode ? [{ debugName: "trackStyle" }] : (
    /* istanbul ignore next */
    []
  ));
  constructor() {
    afterNextRender(() => this.start());
    this.destroyRef.onDestroy(() => this.stop());
  }
  goTo(index) {
    const total = this.count();
    if (total === 0) {
      return;
    }
    this.current.set((index + total) % total);
    this.restart();
  }
  next() {
    this.goTo(this.current() + 1);
  }
  previous() {
    this.goTo(this.current() - 1);
  }
  pause() {
    this.paused.set(true);
    this.stop();
  }
  resume() {
    this.paused.set(false);
    this.start();
  }
  start() {
    if (this.timer !== null || this.paused() || !this.autoplay() || this.count() < 2) {
      return;
    }
    if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    this.timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        this.current.update((index) => (index + 1) % this.count());
      }
    }, this.interval());
  }
  stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  restart() {
    this.stop();
    this.start();
  }
  static \u0275fac = function Carousel_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Carousel)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Carousel, selectors: [["app-carousel"]], hostAttrs: [1, "block"], inputs: { slides: [1, "slides"], interval: [1, "interval"], autoplay: [1, "autoplay"], showControls: [1, "showControls"], showCaptions: [1, "showCaptions"], eager: [1, "eager"] }, decls: 5, vars: 3, consts: [["role", "group", "aria-roledescription", "carrossel", "aria-label", "Fotografias da oficina FS Automotive", 1, "group", "relative", "isolate", "h-full", "w-full", "overflow-hidden", "bg-ink-950", 3, "mouseenter", "mouseleave", "focusin", "focusout"], [1, "flex", "h-full", "w-full", "transition-transform", "duration-700", "ease-[cubic-bezier(0.22,1,0.36,1)]"], ["role", "group", "aria-roledescription", "slide", 1, "relative", "h-full", "w-full", "shrink-0", "grow-0", "basis-full"], ["sizes", "100vw", "imgClass", "h-full w-full object-cover", 3, "image", "priority"], [1, "absolute", "inset-x-0", "bottom-0", "bg-linear-to-t", "from-ink-950/90", "to-transparent", "px-6", "pt-16", "pb-6", "text-sm", "font-medium", "text-white"], ["type", "button", "aria-label", "Fotografia anterior", 1, "absolute", "top-1/2", "left-3", "z-10", "grid", "size-11", "-translate-y-1/2", "cursor-pointer", "place-items-center", "rounded-full", "bg-ink-950/40", "text-white", "opacity-0", "backdrop-blur-sm", "transition", "duration-200", "group-hover:opacity-100", "hover:bg-brand-600", "focus-visible:opacity-100", "sm:left-5", 3, "click"], ["name", "chevron-right", 1, "rotate-180", 3, "size", "strokeWidth"], ["type", "button", "aria-label", "Fotografia seguinte", 1, "absolute", "top-1/2", "right-3", "z-10", "grid", "size-11", "-translate-y-1/2", "cursor-pointer", "place-items-center", "rounded-full", "bg-ink-950/40", "text-white", "opacity-0", "backdrop-blur-sm", "transition", "duration-200", "group-hover:opacity-100", "hover:bg-brand-600", "focus-visible:opacity-100", "sm:right-5", 3, "click"], ["name", "chevron-right", 3, "size", "strokeWidth"], [1, "absolute", "inset-x-0", "bottom-5", "z-10", "flex", "justify-center", "gap-2.5"], ["type", "button", 1, "h-1.5", "cursor-pointer", "rounded-full", "transition-all", "duration-300", 3, "class"], ["type", "button", 1, "h-1.5", "cursor-pointer", "rounded-full", "transition-all", "duration-300", 3, "click"]], template: function Carousel_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275listener("mouseenter", function Carousel_Template_div_mouseenter_0_listener() {
        return ctx.pause();
      })("mouseleave", function Carousel_Template_div_mouseleave_0_listener() {
        return ctx.resume();
      })("focusin", function Carousel_Template_div_focusin_0_listener() {
        return ctx.pause();
      })("focusout", function Carousel_Template_div_focusout_0_listener() {
        return ctx.resume();
      });
      \u0275\u0275elementStart(1, "div", 1);
      \u0275\u0275repeaterCreate(2, Carousel_For_3_Template, 3, 5, "figure", 2, _forTrack02);
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(4, Carousel_Conditional_4_Template, 7, 4);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275styleProp("transform", ctx.trackStyle());
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.slides());
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.showControls() && ctx.count() > 1 ? 4 : -1);
    }
  }, dependencies: [Icon, ResponsiveImage], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Carousel, [{
    type: Component,
    args: [{ selector: "app-carousel", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon, ResponsiveImage], host: { class: "block" }, template: `<div
  class="group relative isolate h-full w-full overflow-hidden bg-ink-950"
  role="group"
  aria-roledescription="carrossel"
  aria-label="Fotografias da oficina FS Automotive"
  (mouseenter)="pause()"
  (mouseleave)="resume()"
  (focusin)="pause()"
  (focusout)="resume()"
>
  <div
    class="flex h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
    [style.transform]="trackStyle()"
  >
    @for (slide of slides(); track slide.src) {
      <figure
        class="relative h-full w-full shrink-0 grow-0 basis-full"
        role="group"
        aria-roledescription="slide"
        [attr.aria-label]="$index + 1 + ' de ' + count()"
        [attr.aria-hidden]="current() !== $index ? 'true' : null"
      >
        <app-responsive-image
          [image]="slide"
          [priority]="eager() && $first"
          sizes="100vw"
          imgClass="h-full w-full object-cover"
        />
        @if (showCaptions() && slide.caption) {
          <figcaption
            class="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink-950/90 to-transparent px-6 pt-16 pb-6 text-sm font-medium text-white"
          >
            {{ slide.caption }}
          </figcaption>
        }
      </figure>
    }
  </div>

  @if (showControls() && count() > 1) {
    <button
      type="button"
      (click)="previous()"
      aria-label="Fotografia anterior"
      class="absolute top-1/2 left-3 z-10 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-ink-950/40 text-white opacity-0 backdrop-blur-sm transition duration-200 group-hover:opacity-100 hover:bg-brand-600 focus-visible:opacity-100 sm:left-5"
    >
      <app-icon name="chevron-right" [size]="20" [strokeWidth]="2.25" class="rotate-180" />
    </button>

    <button
      type="button"
      (click)="next()"
      aria-label="Fotografia seguinte"
      class="absolute top-1/2 right-3 z-10 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-ink-950/40 text-white opacity-0 backdrop-blur-sm transition duration-200 group-hover:opacity-100 hover:bg-brand-600 focus-visible:opacity-100 sm:right-5"
    >
      <app-icon name="chevron-right" [size]="20" [strokeWidth]="2.25" />
    </button>

    <div class="absolute inset-x-0 bottom-5 z-10 flex justify-center gap-2.5">
      @for (slide of slides(); track slide.src) {
        <button
          type="button"
          (click)="goTo($index)"
          [attr.aria-label]="'Ir para a fotografia ' + ($index + 1)"
          [attr.aria-current]="current() === $index ? 'true' : null"
          class="h-1.5 cursor-pointer rounded-full transition-all duration-300"
          [class]="current() === $index ? 'w-8 bg-brand-600' : 'w-4 bg-white/50 hover:bg-white/80'"
        ></button>
      }
    </div>
  }
</div>
` }]
  }], () => [], { slides: [{ type: Input, args: [{ isSignal: true, alias: "slides", required: true }] }], interval: [{ type: Input, args: [{ isSignal: true, alias: "interval", required: false }] }], autoplay: [{ type: Input, args: [{ isSignal: true, alias: "autoplay", required: false }] }], showControls: [{ type: Input, args: [{ isSignal: true, alias: "showControls", required: false }] }], showCaptions: [{ type: Input, args: [{ isSignal: true, alias: "showCaptions", required: false }] }], eager: [{ type: Input, args: [{ isSignal: true, alias: "eager", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Carousel, { className: "Carousel", filePath: "src/app/shared/components/carousel/carousel.ts", lineNumber: 30 });
})();

// src/app/shared/components/cta-band/cta-band.ts
var CtaBand = class _CtaBand {
  eyebrow = input("Fale connosco", ...ngDevMode ? [{ debugName: "eyebrow" }] : (
    /* istanbul ignore next */
    []
  ));
  title = input("Precisa de marcar uma interven\xE7\xE3o?", ...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  lead = input("Diga-nos o que se passa com a sua viatura. Damos-lhe um diagn\xF3stico honesto e um or\xE7amento sem compromisso.", ...ngDevMode ? [{ debugName: "lead" }] : (
    /* istanbul ignore next */
    []
  ));
  site = SITE;
  primary = CALL_ACTION;
  secondary = DIRECTIONS_ACTION;
  static \u0275fac = function CtaBand_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CtaBand)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CtaBand, selectors: [["app-cta-band"]], hostAttrs: [1, "block"], inputs: { eyebrow: [1, "eyebrow"], title: [1, "title"], lead: [1, "lead"] }, decls: 21, vars: 8, consts: [[1, "relative", "isolate", "overflow-hidden", "rounded-3xl", "bg-ink-950", "px-6", "py-section-sm", "sm:px-12"], ["aria-hidden", "true", 1, "pointer-events-none", "absolute", "inset-0", "glow-diagonal"], [1, "relative", "flex", "flex-col", "items-start", "gap-10", "lg:flex-row", "lg:items-center", "lg:justify-between"], [1, "max-w-2xl"], [1, "flex", "items-center", "gap-2", "text-eyebrow", "text-brand-400", "uppercase"], ["aria-hidden", "true", 1, "h-px", "w-6", "bg-current"], [1, "mt-4", "text-h2", "font-extrabold", "text-white"], [1, "mt-4", "text-lead", "text-bone-300"], [1, "mt-6", "flex", "flex-wrap", "items-center", "gap-x-6", "gap-y-2", "text-meta", "text-bone-400"], [1, "inline-flex", "items-center", "gap-2"], ["name", "clock", 1, "text-brand-400", 3, "size"], ["name", "map-pin", 1, "text-brand-400", 3, "size"], [1, "flex", "w-full", "flex-col", "gap-3", "sm:w-auto", "sm:flex-row", "lg:flex-col", "xl:flex-row"], ["variant", "primary", "size", "lg", "iconPosition", "left", 3, "action"], ["variant", "ghost", "size", "lg", "iconPosition", "left", 3, "action"]], template: function CtaBand_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275element(1, "span", 1);
      \u0275\u0275elementStart(2, "div", 2)(3, "div", 3)(4, "p", 4);
      \u0275\u0275element(5, "span", 5);
      \u0275\u0275text(6);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "h2", 6);
      \u0275\u0275text(8);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "p", 7);
      \u0275\u0275text(10);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(11, "p", 8)(12, "span", 9);
      \u0275\u0275element(13, "app-icon", 10);
      \u0275\u0275text(14, " Seg\u2013Sex \xB7 08:30\u201313:00 e 14:30\u201318:30 ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(15, "span", 9);
      \u0275\u0275element(16, "app-icon", 11);
      \u0275\u0275text(17);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(18, "div", 12);
      \u0275\u0275element(19, "app-button", 13)(20, "app-button", 14);
      \u0275\u0275elementEnd()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(6);
      \u0275\u0275textInterpolate1(" ", ctx.eyebrow(), " ");
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" ", ctx.title(), " ");
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.lead());
      \u0275\u0275advance(3);
      \u0275\u0275property("size", 16);
      \u0275\u0275advance(3);
      \u0275\u0275property("size", 16);
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.site.address.city, " ");
      \u0275\u0275advance(2);
      \u0275\u0275property("action", ctx.primary);
      \u0275\u0275advance();
      \u0275\u0275property("action", ctx.secondary);
    }
  }, dependencies: [Icon, UiButton], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CtaBand, [{
    type: Component,
    args: [{ selector: "app-cta-band", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon, UiButton], host: { class: "block" }, template: '<div class="relative isolate overflow-hidden rounded-3xl bg-ink-950 px-6 py-section-sm sm:px-12">\n  <!-- Decorative brand glow: a background layer, so it cannot overflow. -->\n  <span class="pointer-events-none absolute inset-0 glow-diagonal" aria-hidden="true"></span>\n\n  <div class="relative flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">\n    <div class="max-w-2xl">\n      <p class="flex items-center gap-2 text-eyebrow text-brand-400 uppercase">\n        <span class="h-px w-6 bg-current" aria-hidden="true"></span>\n        {{ eyebrow() }}\n      </p>\n      <h2 class="mt-4 text-h2 font-extrabold text-white">\n        {{ title() }}\n      </h2>\n      <p class="mt-4 text-lead text-bone-300">{{ lead() }}</p>\n\n      <p class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-meta text-bone-400">\n        <span class="inline-flex items-center gap-2">\n          <app-icon name="clock" [size]="16" class="text-brand-400" />\n          Seg\u2013Sex \xB7 08:30\u201313:00 e 14:30\u201318:30\n        </span>\n        <span class="inline-flex items-center gap-2">\n          <app-icon name="map-pin" [size]="16" class="text-brand-400" />\n          {{ site.address.city }}\n        </span>\n      </p>\n    </div>\n\n    <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">\n      <app-button [action]="primary" variant="primary" size="lg" iconPosition="left" />\n      <app-button [action]="secondary" variant="ghost" size="lg" iconPosition="left" />\n    </div>\n  </div>\n</div>\n' }]
  }], null, { eyebrow: [{ type: Input, args: [{ isSignal: true, alias: "eyebrow", required: false }] }], title: [{ type: Input, args: [{ isSignal: true, alias: "title", required: false }] }], lead: [{ type: Input, args: [{ isSignal: true, alias: "lead", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CtaBand, { className: "CtaBand", filePath: "src/app/shared/components/cta-band/cta-band.ts", lineNumber: 19 });
})();

// src/app/shared/components/feature-card/feature-card.ts
function FeatureCard_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 2);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classMap(ctx_r0.indexClasses());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
var FeatureCard = class _FeatureCard {
  feature = input.required(...ngDevMode ? [{ debugName: "feature" }] : (
    /* istanbul ignore next */
    []
  ));
  tone = input("light", ...ngDevMode ? [{ debugName: "tone" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Shows a large muted index (01, 02, …) in the corner. */
  index = input(null, ...ngDevMode ? [{ debugName: "index" }] : (
    /* istanbul ignore next */
    []
  ));
  formattedIndex = computed(() => {
    const value = this.index();
    return value === null ? null : String(value).padStart(2, "0");
  }, ...ngDevMode ? [{ debugName: "formattedIndex" }] : (
    /* istanbul ignore next */
    []
  ));
  cardClasses = computed(() => [
    "group relative flex h-full flex-col overflow-hidden rounded-2xl p-7 transition-all duration-300 ease-out",
    this.tone() === "dark" ? "bg-ink-900 ring-1 ring-white/10 ring-inset hover:ring-brand-500/50" : "bg-white shadow-card hover:-translate-y-1 hover:shadow-card-hover"
  ].join(" "), ...ngDevMode ? [{ debugName: "cardClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  iconWrapClasses = computed(() => [
    "inline-flex size-13 items-center justify-center rounded-xl transition-colors duration-300",
    this.tone() === "dark" ? "bg-brand-600/15 text-brand-400 group-hover:bg-brand-600 group-hover:text-white" : "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white"
  ].join(" "), ...ngDevMode ? [{ debugName: "iconWrapClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  titleClasses = computed(() => ["mt-6 text-h3 font-bold", this.tone() === "dark" ? "text-white" : "text-ink-950"].join(" "), ...ngDevMode ? [{ debugName: "titleClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  indexClasses = computed(() => [
    "pointer-events-none absolute -top-2 right-4 text-6xl font-black tabular-nums",
    this.tone() === "dark" ? "text-white/8" : "text-ink-950/5"
  ].join(" "), ...ngDevMode ? [{ debugName: "indexClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  bodyClasses = computed(() => ["mt-2.5 text-body", this.tone() === "dark" ? "text-bone-300" : "text-ink-600"].join(" "), ...ngDevMode ? [{ debugName: "bodyClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function FeatureCard_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FeatureCard)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FeatureCard, selectors: [["app-feature-card"]], hostAttrs: [1, "block", "h-full"], inputs: { feature: [1, "feature"], tone: [1, "tone"], index: [1, "index"] }, decls: 8, vars: 13, consts: [["aria-hidden", "true", 3, "class"], [3, "name", "size"], ["aria-hidden", "true"]], template: function FeatureCard_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "article");
      \u0275\u0275conditionalCreate(1, FeatureCard_Conditional_1_Template, 2, 3, "span", 0);
      \u0275\u0275elementStart(2, "span");
      \u0275\u0275element(3, "app-icon", 1);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(4, "h3");
      \u0275\u0275text(5);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "p");
      \u0275\u0275text(7);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      let tmp_1_0;
      \u0275\u0275classMap(ctx.cardClasses());
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_1_0 = ctx.formattedIndex()) ? 1 : -1, tmp_1_0);
      \u0275\u0275advance();
      \u0275\u0275classMap(ctx.iconWrapClasses());
      \u0275\u0275advance();
      \u0275\u0275property("name", ctx.feature().icon)("size", 26);
      \u0275\u0275advance();
      \u0275\u0275classMap(ctx.titleClasses());
      \u0275\u0275advance();
      \u0275\u0275textInterpolate(ctx.feature().title);
      \u0275\u0275advance();
      \u0275\u0275classMap(ctx.bodyClasses());
      \u0275\u0275advance();
      \u0275\u0275textInterpolate(ctx.feature().description);
    }
  }, dependencies: [Icon], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FeatureCard, [{
    type: Component,
    args: [{ selector: "app-feature-card", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon], host: { class: "block h-full" }, template: '<article [class]="cardClasses()">\n  @if (formattedIndex(); as label) {\n    <span [class]="indexClasses()" aria-hidden="true">{{ label }}</span>\n  }\n\n  <span [class]="iconWrapClasses()">\n    <app-icon [name]="feature().icon" [size]="26" />\n  </span>\n\n  <h3 [class]="titleClasses()">{{ feature().title }}</h3>\n  <p [class]="bodyClasses()">{{ feature().description }}</p>\n</article>\n' }]
  }], null, { feature: [{ type: Input, args: [{ isSignal: true, alias: "feature", required: true }] }], tone: [{ type: Input, args: [{ isSignal: true, alias: "tone", required: false }] }], index: [{ type: Input, args: [{ isSignal: true, alias: "index", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FeatureCard, { className: "FeatureCard", filePath: "src/app/shared/components/feature-card/feature-card.ts", lineNumber: 20 });
})();

// src/app/shared/components/gallery-grid/gallery-grid.ts
var _forTrack03 = ($index, $item) => $item.src;
function GalleryGrid_For_2_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const image_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(image_r4.caption);
  }
}
function GalleryGrid_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "li")(1, "button", 1);
    \u0275\u0275listener("click", function GalleryGrid_For_2_Template_button_click_1_listener() {
      const $index_r2 = \u0275\u0275restoreView(_r1).$index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.openAt($index_r2));
    });
    \u0275\u0275element(2, "app-responsive-image", 2)(3, "span", 3);
    \u0275\u0275elementStart(4, "span", 4);
    \u0275\u0275element(5, "app-icon", 5);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(6, GalleryGrid_For_2_Conditional_6_Template, 2, 1, "span", 6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const image_r4 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275attribute("aria-label", "Ampliar: " + image_r4.alt);
    \u0275\u0275advance();
    \u0275\u0275property("image", image_r4)("sizes", ctx_r2.sizes());
    \u0275\u0275advance(3);
    \u0275\u0275property("size", 16);
    \u0275\u0275advance();
    \u0275\u0275conditional(image_r4.caption ? 6 : -1);
  }
}
var GalleryGrid = class _GalleryGrid {
  images = input.required(...ngDevMode ? [{ debugName: "images" }] : (
    /* istanbul ignore next */
    []
  ));
  columns = input(3, ...ngDevMode ? [{ debugName: "columns" }] : (
    /* istanbul ignore next */
    []
  ));
  lightbox = inject(LightboxService);
  /**
   * Slot width per breakpoint. A two-column grid sits inside a ~58vw page
   * column on large screens, so each tile lands near 28vw there.
   */
  sizes = computed(() => this.columns() === 2 ? "(min-width: 64rem) 28vw, (min-width: 40rem) 46vw, 92vw" : "(min-width: 64rem) 30vw, (min-width: 40rem) 46vw, 92vw", ...ngDevMode ? [{ debugName: "sizes" }] : (
    /* istanbul ignore next */
    []
  ));
  openAt(index) {
    this.lightbox.open(this.images(), index);
  }
  static \u0275fac = function GalleryGrid_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _GalleryGrid)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _GalleryGrid, selectors: [["app-gallery-grid"]], hostAttrs: [1, "block"], inputs: { images: [1, "images"], columns: [1, "columns"] }, decls: 3, vars: 2, consts: [[1, "grid", "gap-4"], ["type", "button", 1, "group", "relative", "block", "w-full", "cursor-pointer", "overflow-hidden", "rounded-2xl", "bg-ink-900", "shadow-card", "transition", "duration-300", "hover:-translate-y-1", "hover:shadow-card-hover", 3, "click"], ["imgClass", "aspect-4/3 w-full object-cover transition duration-500 ease-out group-hover:scale-105", 3, "image", "sizes"], ["aria-hidden", "true", 1, "absolute", "inset-0", "bg-linear-to-t", "from-ink-950/80", "via-ink-950/10", "to-transparent", "opacity-70", "transition-opacity", "duration-300", "group-hover:opacity-95"], ["aria-hidden", "true", 1, "absolute", "right-3", "bottom-3", "grid", "size-9", "place-items-center", "rounded-full", "bg-white/15", "text-white", "opacity-0", "backdrop-blur-sm", "transition", "duration-300", "group-hover:opacity-100"], ["name", "external-link", 3, "size"], [1, "absolute", "inset-x-0", "bottom-0", "px-4", "pb-4", "text-left", "text-sm", "font-semibold", "text-white"]], template: function GalleryGrid_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "ul", 0);
      \u0275\u0275repeaterCreate(1, GalleryGrid_For_2_Template, 7, 5, "li", null, _forTrack03);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275classMap(ctx.columns() === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3");
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.images());
    }
  }, dependencies: [Icon, ResponsiveImage], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(GalleryGrid, [{
    type: Component,
    args: [{ selector: "app-gallery-grid", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon, ResponsiveImage], host: { class: "block" }, template: `<ul class="grid gap-4" [class]="columns() === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'">
  @for (image of images(); track image.src) {
    <li>
      <button
        type="button"
        (click)="openAt($index)"
        [attr.aria-label]="'Ampliar: ' + image.alt"
        class="group relative block w-full cursor-pointer overflow-hidden rounded-2xl bg-ink-900 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover"
      >
        <app-responsive-image
          [image]="image"
          [sizes]="sizes()"
          imgClass="aspect-4/3 w-full object-cover transition duration-500 ease-out group-hover:scale-105"
        />
        <span
          class="absolute inset-0 bg-linear-to-t from-ink-950/80 via-ink-950/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-95"
          aria-hidden="true"
        ></span>
        <span
          class="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition duration-300 group-hover:opacity-100"
          aria-hidden="true"
        >
          <app-icon name="external-link" [size]="16" />
        </span>
        @if (image.caption) {
          <span class="absolute inset-x-0 bottom-0 px-4 pb-4 text-left text-sm font-semibold text-white">{{
            image.caption
          }}</span>
        }
      </button>
    </li>
  }
</ul>
` }]
  }], null, { images: [{ type: Input, args: [{ isSignal: true, alias: "images", required: true }] }], columns: [{ type: Input, args: [{ isSignal: true, alias: "columns", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(GalleryGrid, { className: "GalleryGrid", filePath: "src/app/shared/components/gallery-grid/gallery-grid.ts", lineNumber: 19 });
})();

// src/app/shared/components/page-hero/page-hero.ts
var _c03 = ["*"];
function PageHero_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
var PageHero = class _PageHero {
  eyebrow = input.required(...ngDevMode ? [{ debugName: "eyebrow" }] : (
    /* istanbul ignore next */
    []
  ));
  title = input.required(...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  lead = input(null, ...ngDevMode ? [{ debugName: "lead" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function PageHero_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PageHero)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PageHero, selectors: [["app-page-hero"]], hostAttrs: [1, "block"], inputs: { eyebrow: [1, "eyebrow"], title: [1, "title"], lead: [1, "lead"] }, ngContentSelectors: _c03, decls: 12, vars: 5, consts: [[1, "relative", "isolate", "overflow-hidden", "bg-ink-950"], ["aria-hidden", "true", 1, "pointer-events-none", "absolute", "inset-0", "texture-diagonal"], ["aria-hidden", "true", 1, "pointer-events-none", "absolute", "inset-0", "glow-corner"], ["aria-hidden", "true", 1, "absolute", "inset-x-0", "bottom-0", "h-1", "bg-brand-600"], [1, "relative", "container-page", "py-section-md", "short:py-10"], [1, "flex", "items-center", "gap-2", "text-eyebrow", "text-brand-400", "uppercase"], ["name", "chevron-right", 3, "size", "strokeWidth"], [1, "mt-4", "max-w-4xl", "text-h1", "font-extrabold", "text-white"], [1, "mt-6", "max-w-2xl", "text-lead", "text-bone-300"]], template: function PageHero_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef();
      \u0275\u0275elementStart(0, "section", 0);
      \u0275\u0275element(1, "span", 1)(2, "span", 2)(3, "span", 3);
      \u0275\u0275elementStart(4, "div", 4)(5, "p", 5);
      \u0275\u0275element(6, "app-icon", 6);
      \u0275\u0275text(7);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(8, "h1", 7);
      \u0275\u0275text(9);
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(10, PageHero_Conditional_10_Template, 2, 1, "p", 8);
      \u0275\u0275projection(11);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      let tmp_4_0;
      \u0275\u0275advance(6);
      \u0275\u0275property("size", 14)("strokeWidth", 2.5);
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.eyebrow(), " ");
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" ", ctx.title(), " ");
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_4_0 = ctx.lead()) ? 10 : -1, tmp_4_0);
    }
  }, dependencies: [Icon], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PageHero, [{
    type: Component,
    args: [{ selector: "app-page-hero", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon], host: { class: "block" }, template: '<section class="relative isolate overflow-hidden bg-ink-950">\n  <span class="pointer-events-none absolute inset-0 texture-diagonal" aria-hidden="true"></span>\n  <span class="pointer-events-none absolute inset-0 glow-corner" aria-hidden="true"></span>\n  <span class="absolute inset-x-0 bottom-0 h-1 bg-brand-600" aria-hidden="true"></span>\n\n  <div class="relative container-page py-section-md short:py-10">\n    <p class="flex items-center gap-2 text-eyebrow text-brand-400 uppercase">\n      <app-icon name="chevron-right" [size]="14" [strokeWidth]="2.5" />\n      {{ eyebrow() }}\n    </p>\n    <h1 class="mt-4 max-w-4xl text-h1 font-extrabold text-white">\n      {{ title() }}\n    </h1>\n    @if (lead(); as text) {\n      <p class="mt-6 max-w-2xl text-lead text-bone-300">{{ text }}</p>\n    }\n    <ng-content />\n  </div>\n</section>\n' }]
  }], null, { eyebrow: [{ type: Input, args: [{ isSignal: true, alias: "eyebrow", required: true }] }], title: [{ type: Input, args: [{ isSignal: true, alias: "title", required: true }] }], lead: [{ type: Input, args: [{ isSignal: true, alias: "lead", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PageHero, { className: "PageHero", filePath: "src/app/shared/components/page-hero/page-hero.ts", lineNumber: 16 });
})();

// src/app/shared/components/page-section/page-section.ts
var _c04 = ["*"];
var TONES = {
  bone: "bg-bone-100 text-ink-900",
  white: "bg-white text-ink-900",
  dark: "bg-ink-950 text-bone-100",
  transparent: ""
};
var SPACING = {
  sm: "py-section-sm",
  md: "py-section-md",
  lg: "py-section-lg"
};
var PageSection = class _PageSection {
  tone = input("bone", ...ngDevMode ? [{ debugName: "tone" }] : (
    /* istanbul ignore next */
    []
  ));
  spacing = input("md", ...ngDevMode ? [{ debugName: "spacing" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Anchor id, so CTAs can deep-link to a band (`/servicos#veiculos`). */
  sectionId = input(null, ...ngDevMode ? [{ debugName: "sectionId" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Removes the max-width container for full-bleed content. */
  bleed = input(false, ...ngDevMode ? [{ debugName: "bleed" }] : (
    /* istanbul ignore next */
    []
  ));
  hostClasses = computed(() => ["block", TONES[this.tone()], SPACING[this.spacing()]].filter(Boolean).join(" "), ...ngDevMode ? [{ debugName: "hostClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  containerClasses = computed(() => this.bleed() ? "" : "container-page", ...ngDevMode ? [{ debugName: "containerClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function PageSection_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PageSection)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PageSection, selectors: [["app-page-section"]], hostVars: 3, hostBindings: function PageSection_HostBindings(rf, ctx) {
    if (rf & 2) {
      \u0275\u0275attribute("id", ctx.sectionId());
      \u0275\u0275classMap(ctx.hostClasses());
    }
  }, inputs: { tone: [1, "tone"], spacing: [1, "spacing"], sectionId: [1, "sectionId"], bleed: [1, "bleed"] }, ngContentSelectors: _c04, decls: 2, vars: 2, template: function PageSection_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef();
      \u0275\u0275domElementStart(0, "div");
      \u0275\u0275projection(1);
      \u0275\u0275domElementEnd();
    }
    if (rf & 2) {
      \u0275\u0275classMap(ctx.containerClasses());
    }
  }, encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PageSection, [{
    type: Component,
    args: [{
      selector: "app-page-section",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
    <div [class]="containerClasses()">
      <ng-content />
    </div>
  `,
      host: {
        "[class]": "hostClasses()",
        "[attr.id]": "sectionId()"
      }
    }]
  }], null, { tone: [{ type: Input, args: [{ isSignal: true, alias: "tone", required: false }] }], spacing: [{ type: Input, args: [{ isSignal: true, alias: "spacing", required: false }] }], sectionId: [{ type: Input, args: [{ isSignal: true, alias: "sectionId", required: false }] }], bleed: [{ type: Input, args: [{ isSignal: true, alias: "bleed", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PageSection, { className: "PageSection", filePath: "src/app/shared/components/page-section/page-section.ts", lineNumber: 37 });
})();

// src/app/shared/components/section-heading/section-heading.ts
var _c05 = ["*"];
function SectionHeading_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "p");
    \u0275\u0275domElement(1, "span", 2);
    \u0275\u0275text(2);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classMap(ctx_r0.eyebrowClasses());
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx, " ");
  }
}
function SectionHeading_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "h1");
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classMap(ctx_r0.titleClasses());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.title());
  }
}
function SectionHeading_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "h2");
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classMap(ctx_r0.titleClasses());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.title());
  }
}
function SectionHeading_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "p");
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classMap(ctx_r0.leadClasses());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
var SectionHeading = class _SectionHeading {
  eyebrow = input(null, ...ngDevMode ? [{ debugName: "eyebrow" }] : (
    /* istanbul ignore next */
    []
  ));
  title = input.required(...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  lead = input(null, ...ngDevMode ? [{ debugName: "lead" }] : (
    /* istanbul ignore next */
    []
  ));
  align = input("center", ...ngDevMode ? [{ debugName: "align" }] : (
    /* istanbul ignore next */
    []
  ));
  /** `dark` inverts the palette for use on the ink-coloured bands. */
  tone = input("light", ...ngDevMode ? [{ debugName: "tone" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Renders the title as `<h1>`; one per page. */
  level = input(2, ...ngDevMode ? [{ debugName: "level" }] : (
    /* istanbul ignore next */
    []
  ));
  hostClasses = computed(() => ["block", this.align() === "center" ? "text-center mx-auto max-w-3xl" : "text-left"].join(" "), ...ngDevMode ? [{ debugName: "hostClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  eyebrowClasses = computed(() => [
    "inline-flex items-center gap-2 text-eyebrow uppercase",
    this.tone() === "dark" ? "text-brand-400" : "text-brand-600"
  ].join(" "), ...ngDevMode ? [{ debugName: "eyebrowClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  titleClasses = computed(() => [
    "font-extrabold",
    this.level() === 1 ? "text-h1" : "text-h2",
    this.tone() === "dark" ? "text-white" : "text-ink-950",
    this.eyebrow() ? "mt-4" : ""
  ].filter(Boolean).join(" "), ...ngDevMode ? [{ debugName: "titleClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  leadClasses = computed(() => [
    "mt-5 text-lead",
    this.tone() === "dark" ? "text-bone-300" : "text-ink-600",
    this.align() === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"
  ].join(" "), ...ngDevMode ? [{ debugName: "leadClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  ruleClasses = computed(() => ["mt-5 h-1 w-16 rounded-full bg-brand-600", this.align() === "center" ? "mx-auto" : ""].join(" "), ...ngDevMode ? [{ debugName: "ruleClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function SectionHeading_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SectionHeading)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SectionHeading, selectors: [["app-section-heading"]], hostVars: 2, hostBindings: function SectionHeading_HostBindings(rf, ctx) {
    if (rf & 2) {
      \u0275\u0275classMap(ctx.hostClasses());
    }
  }, inputs: { eyebrow: [1, "eyebrow"], title: [1, "title"], lead: [1, "lead"], align: [1, "align"], tone: [1, "tone"], level: [1, "level"] }, ngContentSelectors: _c05, decls: 6, vars: 5, consts: [[3, "class"], ["aria-hidden", "true"], ["aria-hidden", "true", 1, "h-px", "w-6", "bg-current"]], template: function SectionHeading_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef();
      \u0275\u0275conditionalCreate(0, SectionHeading_Conditional_0_Template, 3, 3, "p", 0);
      \u0275\u0275conditionalCreate(1, SectionHeading_Conditional_1_Template, 2, 3, "h1", 0)(2, SectionHeading_Conditional_2_Template, 2, 3, "h2", 0);
      \u0275\u0275domElement(3, "div", 1);
      \u0275\u0275conditionalCreate(4, SectionHeading_Conditional_4_Template, 2, 3, "p", 0);
      \u0275\u0275projection(5);
    }
    if (rf & 2) {
      let tmp_0_0;
      let tmp_3_0;
      \u0275\u0275conditional((tmp_0_0 = ctx.eyebrow()) ? 0 : -1, tmp_0_0);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.level() === 1 ? 1 : 2);
      \u0275\u0275advance(2);
      \u0275\u0275classMap(ctx.ruleClasses());
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_3_0 = ctx.lead()) ? 4 : -1, tmp_3_0);
    }
  }, encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SectionHeading, [{
    type: Component,
    args: [{ selector: "app-section-heading", changeDetection: ChangeDetectionStrategy.OnPush, host: { "[class]": "hostClasses()" }, template: '@if (eyebrow(); as text) {\n  <p [class]="eyebrowClasses()">\n    <span class="h-px w-6 bg-current" aria-hidden="true"></span>\n    {{ text }}\n  </p>\n}\n\n@if (level() === 1) {\n  <h1 [class]="titleClasses()">{{ title() }}</h1>\n} @else {\n  <h2 [class]="titleClasses()">{{ title() }}</h2>\n}\n\n<div [class]="ruleClasses()" aria-hidden="true"></div>\n\n@if (lead(); as text) {\n  <p [class]="leadClasses()">{{ text }}</p>\n}\n\n<ng-content />\n' }]
  }], null, { eyebrow: [{ type: Input, args: [{ isSignal: true, alias: "eyebrow", required: false }] }], title: [{ type: Input, args: [{ isSignal: true, alias: "title", required: true }] }], lead: [{ type: Input, args: [{ isSignal: true, alias: "lead", required: false }] }], align: [{ type: Input, args: [{ isSignal: true, alias: "align", required: false }] }], tone: [{ type: Input, args: [{ isSignal: true, alias: "tone", required: false }] }], level: [{ type: Input, args: [{ isSignal: true, alias: "level", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SectionHeading, { className: "SectionHeading", filePath: "src/app/shared/components/section-heading/section-heading.ts", lineNumber: 16 });
})();

// src/app/shared/components/vehicle-card/vehicle-card.ts
var VehicleCard = class _VehicleCard {
  vehicle = input.required(...ngDevMode ? [{ debugName: "vehicle" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function VehicleCard_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _VehicleCard)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _VehicleCard, selectors: [["app-vehicle-card"]], hostAttrs: [1, "block", "h-full"], inputs: { vehicle: [1, "vehicle"] }, decls: 7, vars: 4, consts: [[1, "group", "flex", "h-full", "flex-col", "items-center", "rounded-2xl", "bg-white", "p-6", "text-center", "shadow-card", "transition-all", "duration-300", "ease-out", "hover:-translate-y-1", "hover:shadow-card-hover"], [1, "grid", "size-20", "place-items-center", "rounded-2xl", "bg-bone-200", "transition-colors", "duration-300", "group-hover:bg-brand-50"], ["aria-hidden", "true", "loading", "lazy", "decoding", "async", "width", "125", "height", "125", 1, "size-12", "object-contain", "transition-transform", "duration-300", "group-hover:scale-110", 3, "src", "alt"], [1, "mt-5", "text-h3", "font-bold", "text-ink-950"], [1, "mt-2", "text-meta", "text-ink-500"]], template: function VehicleCard_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275domElementStart(0, "article", 0)(1, "span", 1);
      \u0275\u0275domElement(2, "img", 2);
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(3, "h3", 3);
      \u0275\u0275text(4);
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(5, "p", 4);
      \u0275\u0275text(6);
      \u0275\u0275domElementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275domProperty("src", ctx.vehicle().image, \u0275\u0275sanitizeUrl)("alt", "");
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" ", ctx.vehicle().label, " ");
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.vehicle().description);
    }
  }, encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(VehicleCard, [{
    type: Component,
    args: [{ selector: "app-vehicle-card", changeDetection: ChangeDetectionStrategy.OnPush, host: { class: "block h-full" }, template: `<article
  class="group flex h-full flex-col items-center rounded-2xl bg-white p-6 text-center shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-card-hover"
>
  <span
    class="grid size-20 place-items-center rounded-2xl bg-bone-200 transition-colors duration-300 group-hover:bg-brand-50"
  >
    <img
      [src]="vehicle().image"
      [alt]="''"
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      width="125"
      height="125"
      class="size-12 object-contain transition-transform duration-300 group-hover:scale-110"
    />
  </span>

  <h3 class="mt-5 text-h3 font-bold text-ink-950">
    {{ vehicle().label }}
  </h3>
  <p class="mt-2 text-meta text-ink-500">{{ vehicle().description }}</p>
</article>
` }]
  }], null, { vehicle: [{ type: Input, args: [{ isSignal: true, alias: "vehicle", required: true }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(VehicleCard, { className: "VehicleCard", filePath: "src/app/shared/components/vehicle-card/vehicle-card.ts", lineNumber: 12 });
})();

// src/app/shared/directives/reveal.directive.ts
var RevealDirective = class _RevealDirective {
  /** Stagger in milliseconds, for lists that should cascade in. */
  revealDelay = input(0, ...ngDevMode ? [{ debugName: "revealDelay" }] : (
    /* istanbul ignore next */
    []
  ));
  host = inject(ElementRef);
  constructor() {
    afterNextRender(() => this.observe());
  }
  observe() {
    const element = this.host.nativeElement;
    const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      return;
    }
    element.classList.add("reveal");
    if (this.revealDelay() > 0) {
      element.style.transitionDelay = `${this.revealDelay()}ms`;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          element.classList.add("reveal-visible");
          observer.disconnect();
        }
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    observer.observe(element);
  }
  static \u0275fac = function RevealDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RevealDirective)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({ type: _RevealDirective, selectors: [["", "appReveal", ""]], inputs: { revealDelay: [1, "revealDelay"] } });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RevealDirective, [{
    type: Directive,
    args: [{
      selector: "[appReveal]"
    }]
  }], () => [], { revealDelay: [{ type: Input, args: [{ isSignal: true, alias: "revealDelay", required: false }] }] });
})();

export {
  Accordion,
  AccordionItem,
  ContactChannels,
  Carousel,
  CtaBand,
  FeatureCard,
  GalleryGrid,
  PageHero,
  PageSection,
  SectionHeading,
  VehicleCard,
  RevealDirective
};
//# sourceMappingURL=chunk-A7H3SNWI.js.map
