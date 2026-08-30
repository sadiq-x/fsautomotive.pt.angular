import {
  UiButton
} from "./chunk-NGHYTC22.js";
import {
  ConsentService,
  OPENING_HOURS,
  SITE
} from "./chunk-UVBD33FH.js";
import {
  Icon
} from "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DomSanitizer,
  Injectable,
  Input,
  computed,
  effect,
  inject,
  input,
  setClassMetadata,
  signal,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
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
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵrestoreView,
  ɵɵsanitizeResourceUrl,
  ɵɵsanitizeUrl,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate2
} from "./chunk-RUFDRP5X.js";

// src/app/shared/components/map-embed/map-embed.ts
var MapEmbed = class _MapEmbed {
  title = input("Localiza\xE7\xE3o da FS Automotive no Google Maps", ...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Any Tailwind aspect/height utilities for the frame wrapper. */
  frameClass = input("aspect-[4/3] sm:aspect-[16/10]", ...ngDevMode ? [{ debugName: "frameClass" }] : (
    /* istanbul ignore next */
    []
  ));
  sanitizer = inject(DomSanitizer);
  embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(SITE.address.embedUrl);
  static \u0275fac = function MapEmbed_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MapEmbed)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _MapEmbed, selectors: [["app-map-embed"]], hostAttrs: [1, "block"], inputs: { title: [1, "title"], frameClass: [1, "frameClass"] }, decls: 2, vars: 4, consts: [[1, "relative", "overflow-hidden", "rounded-2xl", "bg-bone-200", "shadow-card", "ring-1", "ring-ink-950/5"], ["loading", "lazy", "referrerpolicy", "no-referrer-when-downgrade", "allowfullscreen", "", 1, "absolute", "inset-0", "h-full", "w-full", "border-0", 3, "src", "title"]], template: function MapEmbed_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275domElementStart(0, "div", 0);
      \u0275\u0275domElement(1, "iframe", 1);
      \u0275\u0275domElementEnd();
    }
    if (rf & 2) {
      \u0275\u0275classMap(ctx.frameClass());
      \u0275\u0275advance();
      \u0275\u0275domProperty("src", ctx.embedUrl, \u0275\u0275sanitizeResourceUrl)("title", ctx.title());
    }
  }, encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MapEmbed, [{
    type: Component,
    args: [{ selector: "app-map-embed", changeDetection: ChangeDetectionStrategy.OnPush, host: { class: "block" }, template: '<div\n  class="relative overflow-hidden rounded-2xl bg-bone-200 shadow-card ring-1 ring-ink-950/5"\n  [class]="frameClass()"\n>\n  <iframe\n    [src]="embedUrl"\n    [title]="title()"\n    class="absolute inset-0 h-full w-full border-0"\n    loading="lazy"\n    referrerpolicy="no-referrer-when-downgrade"\n    allowfullscreen\n  ></iframe>\n</div>\n' }]
  }], null, { title: [{ type: Input, args: [{ isSignal: true, alias: "title", required: false }] }], frameClass: [{ type: Input, args: [{ isSignal: true, alias: "frameClass", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(MapEmbed, { className: "MapEmbed", filePath: "src/app/shared/components/map-embed/map-embed.ts", lineNumber: 18 });
})();

// src/app/shared/components/opening-hours/opening-hours.ts
var _forTrack0 = ($index, $item) => $item.days;
function OpeningHours_For_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "span");
    \u0275\u0275text(1, "Fechado");
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275classMap(ctx_r0.closedBadgeClasses());
  }
}
function OpeningHours_For_2_Conditional_4_For_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "span", 7);
    \u0275\u0275text(1, "|");
    \u0275\u0275domElementEnd();
  }
}
function OpeningHours_For_2_Conditional_4_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "span", 6);
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
    \u0275\u0275conditionalCreate(2, OpeningHours_For_2_Conditional_4_For_2_Conditional_2_Template, 2, 0, "span", 7);
  }
  if (rf & 2) {
    const period_r2 = ctx.$implicit;
    const \u0275$index_16_r3 = ctx.$index;
    const \u0275$count_16_r4 = ctx.$count;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(period_r2);
    \u0275\u0275advance();
    \u0275\u0275conditional(!(\u0275$index_16_r3 === \u0275$count_16_r4 - 1) ? 2 : -1);
  }
}
function OpeningHours_For_2_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "span", 5);
    \u0275\u0275repeaterCreate(1, OpeningHours_For_2_Conditional_4_For_2_Template, 3, 2, null, null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const entry_r5 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classMap(ctx_r0.periodClasses());
    \u0275\u0275advance();
    \u0275\u0275repeater(entry_r5.periods);
  }
}
function OpeningHours_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "li", 1)(1, "span", 2);
    \u0275\u0275text(2);
    \u0275\u0275domElementEnd();
    \u0275\u0275conditionalCreate(3, OpeningHours_For_2_Conditional_3_Template, 2, 2, "span", 3)(4, OpeningHours_For_2_Conditional_4_Template, 3, 2, "span", 4);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const entry_r5 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r0.dayClasses());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(entry_r5.days);
    \u0275\u0275advance();
    \u0275\u0275conditional(entry_r5.closed ? 3 : 4);
  }
}
var OpeningHours = class _OpeningHours {
  tone = input("light", ...ngDevMode ? [{ debugName: "tone" }] : (
    /* istanbul ignore next */
    []
  ));
  entries = OPENING_HOURS;
  rowClasses = computed(() => this.tone() === "dark" ? "border-white/10" : "border-ink-200/70", ...ngDevMode ? [{ debugName: "rowClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  dayClasses = computed(() => this.tone() === "dark" ? "text-white" : "text-ink-950", ...ngDevMode ? [{ debugName: "dayClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  periodClasses = computed(() => this.tone() === "dark" ? "text-bone-300" : "text-ink-600", ...ngDevMode ? [{ debugName: "periodClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  closedBadgeClasses = computed(() => [
    "rounded-full px-3 py-1 text-meta font-bold tracking-wide uppercase",
    this.tone() === "dark" ? "bg-white/10 text-bone-400" : "bg-ink-950/5 text-ink-500"
  ].join(" "), ...ngDevMode ? [{ debugName: "closedBadgeClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function OpeningHours_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _OpeningHours)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _OpeningHours, selectors: [["app-opening-hours"]], hostAttrs: [1, "block"], inputs: { tone: [1, "tone"] }, decls: 3, vars: 2, consts: [[1, "divide-y"], [1, "flex", "flex-wrap", "items-center", "justify-between", "gap-x-6", "gap-y-1.5", "py-3.5"], [1, "text-body", "font-semibold"], [3, "class"], [1, "flex", "flex-wrap", "items-center", "gap-x-2", "gap-y-1", "text-body", "tabular-nums", 3, "class"], [1, "flex", "flex-wrap", "items-center", "gap-x-2", "gap-y-1", "text-body", "tabular-nums"], [1, "font-medium"], ["aria-hidden", "true", 1, "text-ink-300"]], template: function OpeningHours_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275domElementStart(0, "ul", 0);
      \u0275\u0275repeaterCreate(1, OpeningHours_For_2_Template, 5, 4, "li", 1, _forTrack0);
      \u0275\u0275domElementEnd();
    }
    if (rf & 2) {
      \u0275\u0275classMap(ctx.rowClasses());
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.entries);
    }
  }, encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(OpeningHours, [{
    type: Component,
    args: [{ selector: "app-opening-hours", changeDetection: ChangeDetectionStrategy.OnPush, host: { class: "block" }, template: '<ul class="divide-y" [class]="rowClasses()">\n  @for (entry of entries; track entry.days) {\n    <li class="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 py-3.5">\n      <span class="text-body font-semibold" [class]="dayClasses()">{{ entry.days }}</span>\n\n      @if (entry.closed) {\n        <span [class]="closedBadgeClasses()">Fechado</span>\n      } @else {\n        <span\n          class="flex flex-wrap items-center gap-x-2 gap-y-1 text-body tabular-nums"\n          [class]="periodClasses()"\n        >\n          @for (period of entry.periods; track period) {\n            <span class="font-medium">{{ period }}</span>\n            @if (!$last) {\n              <span class="text-ink-300" aria-hidden="true">|</span>\n            }\n          }\n        </span>\n      }\n    </li>\n  }\n</ul>\n' }]
  }], null, { tone: [{ type: Input, args: [{ isSignal: true, alias: "tone", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(OpeningHours, { className: "OpeningHours", filePath: "src/app/shared/components/opening-hours/opening-hours.ts", lineNumber: 14 });
})();

// src/app/shared/components/social-links/social-links.ts
var _forTrack02 = ($index, $item) => $item.href;
function SocialLinks_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li")(1, "a", 1);
    \u0275\u0275element(2, "app-icon", 2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const social_r1 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.linkClasses());
    \u0275\u0275property("href", social_r1.href, \u0275\u0275sanitizeUrl);
    \u0275\u0275attribute("target", social_r1.href.startsWith("http") ? "_blank" : null)("rel", social_r1.href.startsWith("http") ? "noopener noreferrer" : null)("aria-label", "FS Automotive no " + social_r1.label);
    \u0275\u0275advance();
    \u0275\u0275property("name", social_r1.icon)("size", ctx_r1.size());
  }
}
var SocialLinks = class _SocialLinks {
  tone = input("dark", ...ngDevMode ? [{ debugName: "tone" }] : (
    /* istanbul ignore next */
    []
  ));
  size = input(20, ...ngDevMode ? [{ debugName: "size" }] : (
    /* istanbul ignore next */
    []
  ));
  socials = SITE.socials;
  linkClasses = computed(() => [
    "grid size-11 place-items-center rounded-full transition-all duration-200 hover:-translate-y-0.5",
    this.tone() === "dark" ? "bg-white/8 text-bone-200 ring-1 ring-white/12 ring-inset hover:bg-brand-600 hover:text-white hover:ring-brand-600" : "bg-bone-200 text-ink-700 hover:bg-brand-600 hover:text-white"
  ].join(" "), ...ngDevMode ? [{ debugName: "linkClasses" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function SocialLinks_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SocialLinks)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SocialLinks, selectors: [["app-social-links"]], hostAttrs: [1, "block"], inputs: { tone: [1, "tone"], size: [1, "size"] }, decls: 3, vars: 0, consts: [[1, "flex", "items-center", "gap-3"], [3, "href"], [3, "name", "size"]], template: function SocialLinks_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "ul", 0);
      \u0275\u0275repeaterCreate(1, SocialLinks_For_2_Template, 3, 8, "li", null, _forTrack02);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.socials);
    }
  }, dependencies: [Icon], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SocialLinks, [{
    type: Component,
    args: [{ selector: "app-social-links", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon], host: { class: "block" }, template: `<ul class="flex items-center gap-3">
  @for (social of socials; track social.href) {
    <li>
      <a
        [href]="social.href"
        [class]="linkClasses()"
        [attr.target]="social.href.startsWith('http') ? '_blank' : null"
        [attr.rel]="social.href.startsWith('http') ? 'noopener noreferrer' : null"
        [attr.aria-label]="'FS Automotive no ' + social.label"
      >
        <app-icon [name]="social.icon" [size]="size()" />
      </a>
    </li>
  }
</ul>
` }]
  }], null, { tone: [{ type: Input, args: [{ isSignal: true, alias: "tone", required: false }] }], size: [{ type: Input, args: [{ isSignal: true, alias: "size", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SocialLinks, { className: "SocialLinks", filePath: "src/app/shared/components/social-links/social-links.ts", lineNumber: 16 });
})();

// src/app/shared/components/cookie-notice/cookie-notice.ts
function CookieNotice_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "section", 2)(3, "p", 3)(4, "span", 4);
    \u0275\u0275text(5, "Medimos as visitas de forma an\xF3nima.");
    \u0275\u0275elementEnd();
    \u0275\u0275text(6, " N\xE3o utilizamos cookies nem recolhemos nada que o identifique \u2014 apenas as p\xE1ginas mais vistas, para percebermos o que \xE9 \xFAtil. Pode recusar; a sua escolha fica guardada neste navegador. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 5)(8, "app-button", 6);
    \u0275\u0275listener("click", function CookieNotice_Conditional_0_Template_app_button_click_8_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.consent.decline());
    });
    \u0275\u0275text(9, " Recusar ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "app-button", 7);
    \u0275\u0275listener("click", function CookieNotice_Conditional_0_Template_app_button_click_10_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.consent.accept());
    });
    \u0275\u0275text(11, " Aceitar ");
    \u0275\u0275elementEnd()()()()();
  }
}
var CookieNotice = class _CookieNotice {
  consent = inject(ConsentService);
  static \u0275fac = function CookieNotice_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CookieNotice)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CookieNotice, selectors: [["app-cookie-notice"]], decls: 1, vars: 1, consts: [[1, "pointer-events-none", "fixed", "inset-x-0", "bottom-[calc(4rem+env(safe-area-inset-bottom))]", "z-50", "md:bottom-0"], [1, "container-page", "pb-4", "md:pb-6"], ["role", "region", "aria-label", "Aviso de privacidade", 1, "pointer-events-auto", "mx-auto", "flex", "max-w-3xl", "animate-fade-up", "flex-col", "gap-4", "rounded-2xl", "bg-white", "p-5", "shadow-card", "ring-1", "ring-ink-950/8", "sm:p-6", "lg:flex-row", "lg:items-center", "lg:gap-6", "short:gap-3", "short:p-4"], [1, "text-meta", "text-ink-600"], [1, "font-semibold", "text-ink-900"], [1, "flex", "shrink-0", "gap-3", "max-lg:w-full"], ["variant", "secondary", "size", "sm", 1, "flex-1", "lg:flex-none", 3, "click"], ["variant", "primary", "size", "sm", 1, "flex-1", "lg:flex-none", 3, "click"]], template: function CookieNotice_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275conditionalCreate(0, CookieNotice_Conditional_0_Template, 12, 0, "div", 0);
    }
    if (rf & 2) {
      \u0275\u0275conditional(ctx.consent.needsNotice() ? 0 : -1);
    }
  }, dependencies: [UiButton], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CookieNotice, [{
    type: Component,
    args: [{ selector: "app-cookie-notice", changeDetection: ChangeDetectionStrategy.OnPush, imports: [UiButton], template: '@if (consent.needsNotice()) {\n  <!--\n    Sits above the mobile tab bar (4rem tall plus the safe-area inset it pads\n    itself with), and drops to the bottom edge once that bar is hidden at `md`.\n    The wrapper spans the viewport so the card can use the page gutter, but it\n    is click-through: only the card itself takes pointer events.\n  -->\n  <div\n    class="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 md:bottom-0"\n  >\n    <div class="container-page pb-4 md:pb-6">\n      <section\n        role="region"\n        aria-label="Aviso de privacidade"\n        class="pointer-events-auto mx-auto flex max-w-3xl animate-fade-up flex-col gap-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/8 sm:p-6 lg:flex-row lg:items-center lg:gap-6 short:gap-3 short:p-4"\n      >\n        <p class="text-meta text-ink-600">\n          <span class="font-semibold text-ink-900">Medimos as visitas de forma an\xF3nima.</span>\n          N\xE3o utilizamos cookies nem recolhemos nada que o identifique \u2014 apenas as p\xE1ginas mais vistas, para\n          percebermos o que \xE9 \xFAtil. Pode recusar; a sua escolha fica guardada neste navegador.\n        </p>\n\n        <div class="flex shrink-0 gap-3 max-lg:w-full">\n          <app-button variant="secondary" size="sm" class="flex-1 lg:flex-none" (click)="consent.decline()">\n            Recusar\n          </app-button>\n          <app-button variant="primary" size="sm" class="flex-1 lg:flex-none" (click)="consent.accept()">\n            Aceitar\n          </app-button>\n        </div>\n      </section>\n    </div>\n  </div>\n}\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CookieNotice, { className: "CookieNotice", filePath: "src/app/shared/components/cookie-notice/cookie-notice.ts", lineNumber: 27 });
})();

// src/app/shared/components/responsive-image/responsive-image.ts
var ResponsiveImage = class _ResponsiveImage {
  image = input.required(...ngDevMode ? [{ debugName: "image" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Slot width per breakpoint — tells the browser which rendition to pick. */
  sizes = input("100vw", ...ngDevMode ? [{ debugName: "sizes" }] : (
    /* istanbul ignore next */
    []
  ));
  imgClass = input("", ...ngDevMode ? [{ debugName: "imgClass" }] : (
    /* istanbul ignore next */
    []
  ));
  /** LCP-critical images are fetched eagerly at high priority. */
  priority = input(false, ...ngDevMode ? [{ debugName: "priority" }] : (
    /* istanbul ignore next */
    []
  ));
  srcset = computed(() => {
    const { src, widths, width } = this.image();
    if (!widths?.length) {
      return null;
    }
    const dot = src.lastIndexOf(".");
    const base = src.slice(0, dot);
    const extension = src.slice(dot);
    return [...widths.map((w) => `${base}-${w}${extension} ${w}w`), `${src} ${width}w`].join(", ");
  }, ...ngDevMode ? [{ debugName: "srcset" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function ResponsiveImage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ResponsiveImage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ResponsiveImage, selectors: [["app-responsive-image"]], hostAttrs: [1, "contents"], inputs: { image: [1, "image"], sizes: [1, "sizes"], imgClass: [1, "imgClass"], priority: [1, "priority"] }, decls: 1, vars: 10, consts: [["decoding", "async", 3, "src", "alt", "width", "height"]], template: function ResponsiveImage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275domElement(0, "img", 0);
    }
    if (rf & 2) {
      \u0275\u0275classMap(ctx.imgClass());
      \u0275\u0275domProperty("src", ctx.image().src, \u0275\u0275sanitizeUrl)("alt", ctx.image().alt)("width", ctx.image().width)("height", ctx.image().height);
      \u0275\u0275attribute("srcset", ctx.srcset())("sizes", ctx.srcset() ? ctx.sizes() : null)("loading", ctx.priority() ? "eager" : "lazy")("fetchpriority", ctx.priority() ? "high" : "auto");
    }
  }, encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ResponsiveImage, [{
    type: Component,
    args: [{ selector: "app-responsive-image", changeDetection: ChangeDetectionStrategy.OnPush, host: { class: "contents" }, template: `<img
  [src]="image().src"
  [attr.srcset]="srcset()"
  [attr.sizes]="srcset() ? sizes() : null"
  [alt]="image().alt"
  [width]="image().width"
  [height]="image().height"
  [class]="imgClass()"
  [attr.loading]="priority() ? 'eager' : 'lazy'"
  [attr.fetchpriority]="priority() ? 'high' : 'auto'"
  decoding="async"
/>
` }]
  }], null, { image: [{ type: Input, args: [{ isSignal: true, alias: "image", required: true }] }], sizes: [{ type: Input, args: [{ isSignal: true, alias: "sizes", required: false }] }], imgClass: [{ type: Input, args: [{ isSignal: true, alias: "imgClass", required: false }] }], priority: [{ type: Input, args: [{ isSignal: true, alias: "priority", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ResponsiveImage, { className: "ResponsiveImage", filePath: "src/app/shared/components/responsive-image/responsive-image.ts", lineNumber: 22 });
})();

// src/app/shared/components/lightbox/lightbox.service.ts
var LightboxService = class _LightboxService {
  images = signal([], ...ngDevMode ? [{ debugName: "images" }] : (
    /* istanbul ignore next */
    []
  ));
  index = signal(0, ...ngDevMode ? [{ debugName: "index" }] : (
    /* istanbul ignore next */
    []
  ));
  isOpen = signal(false, ...ngDevMode ? [{ debugName: "isOpen" }] : (
    /* istanbul ignore next */
    []
  ));
  current = computed(() => this.images()[this.index()] ?? null, ...ngDevMode ? [{ debugName: "current" }] : (
    /* istanbul ignore next */
    []
  ));
  total = computed(() => this.images().length, ...ngDevMode ? [{ debugName: "total" }] : (
    /* istanbul ignore next */
    []
  ));
  position = computed(() => this.index() + 1, ...ngDevMode ? [{ debugName: "position" }] : (
    /* istanbul ignore next */
    []
  ));
  open(images, startIndex = 0) {
    if (images.length === 0) {
      return;
    }
    this.images.set(images);
    this.index.set(Math.min(Math.max(startIndex, 0), images.length - 1));
    this.isOpen.set(true);
  }
  close() {
    this.isOpen.set(false);
  }
  next() {
    this.index.update((i) => (i + 1) % this.total());
  }
  previous() {
    this.index.update((i) => (i - 1 + this.total()) % this.total());
  }
  static \u0275fac = function LightboxService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LightboxService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _LightboxService, factory: _LightboxService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LightboxService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();

// src/app/shared/components/lightbox/lightbox.ts
function Lightbox_Conditional_0_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 5);
    \u0275\u0275listener("click", function Lightbox_Conditional_0_Conditional_3_Template_button_click_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      ctx_r1.lightbox.previous();
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275element(1, "app-icon", 6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "button", 7);
    \u0275\u0275listener("click", function Lightbox_Conditional_0_Conditional_3_Template_button_click_2_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      ctx_r1.lightbox.next();
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275element(3, "app-icon", 8);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("size", 22)("strokeWidth", 2.25);
    \u0275\u0275advance(2);
    \u0275\u0275property("size", 22)("strokeWidth", 2.25);
  }
}
function Lightbox_Conditional_0_Conditional_4_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const image_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(image_r4.caption);
  }
}
function Lightbox_Conditional_0_Conditional_4_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2("", ctx_r1.lightbox.position(), " / ", ctx_r1.lightbox.total());
  }
}
function Lightbox_Conditional_0_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "figure", 9);
    \u0275\u0275listener("click", function Lightbox_Conditional_0_Conditional_4_Template_figure_click_0_listener($event) {
      return $event.stopPropagation();
    });
    \u0275\u0275element(1, "app-responsive-image", 10);
    \u0275\u0275elementStart(2, "figcaption", 11);
    \u0275\u0275conditionalCreate(3, Lightbox_Conditional_0_Conditional_4_Conditional_3_Template, 2, 1, "span");
    \u0275\u0275conditionalCreate(4, Lightbox_Conditional_0_Conditional_4_Conditional_4_Template, 2, 2, "span", 12);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const image_r4 = ctx;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("image", image_r4);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(image_r4.caption ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.lightbox.total() > 1 ? 4 : -1);
  }
}
function Lightbox_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275listener("click", function Lightbox_Conditional_0_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.lightbox.close());
    });
    \u0275\u0275elementStart(1, "button", 2);
    \u0275\u0275listener("click", function Lightbox_Conditional_0_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.lightbox.close());
    });
    \u0275\u0275element(2, "app-icon", 3);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(3, Lightbox_Conditional_0_Conditional_3_Template, 4, 4);
    \u0275\u0275conditionalCreate(4, Lightbox_Conditional_0_Conditional_4_Template, 5, 3, "figure", 4);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_4_0;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("size", 22)("strokeWidth", 2.25);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.lightbox.total() > 1 ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_4_0 = ctx_r1.lightbox.current()) ? 4 : -1, tmp_4_0);
  }
}
var Lightbox = class _Lightbox {
  document = inject(DOCUMENT);
  lastFocused = null;
  scrollY = 0;
  locked = false;
  lightbox = inject(LightboxService);
  constructor() {
    effect(() => {
      const open = this.lightbox.isOpen();
      if (open && !this.locked) {
        this.lock();
      } else if (!open && this.locked) {
        this.unlock();
      }
    });
  }
  /**
   * Locks background scrolling.
   *
   * `overflow: hidden` on `<body>` is not enough — iOS Safari keeps scrolling
   * the page behind the overlay. Pinning the body with `position: fixed` at a
   * negative offset is the technique that holds everywhere; the offset is
   * replayed on unlock so the visitor returns to exactly where they were.
   */
  lock() {
    const body = this.document.body;
    this.lastFocused = this.document.activeElement;
    this.scrollY = globalThis.scrollY;
    body.style.position = "fixed";
    body.style.top = `-${this.scrollY}px`;
    body.style.insetInline = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    this.locked = true;
  }
  unlock() {
    const body = this.document.body;
    for (const property of ["position", "top", "inset-inline", "width", "overflow"]) {
      body.style.removeProperty(property);
    }
    globalThis.scrollTo({ top: this.scrollY, behavior: "instant" });
    this.locked = false;
    this.lastFocused?.focus?.();
    this.lastFocused = null;
  }
  onKeydown(event) {
    if (!this.lightbox.isOpen()) {
      return;
    }
    switch (event.key) {
      case "Escape":
        this.lightbox.close();
        break;
      case "ArrowRight":
        this.lightbox.next();
        break;
      case "ArrowLeft":
        this.lightbox.previous();
        break;
      default:
        return;
    }
    event.preventDefault();
  }
  static \u0275fac = function Lightbox_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Lightbox)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Lightbox, selectors: [["app-lightbox"]], hostBindings: function Lightbox_HostBindings(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275listener("keydown", function Lightbox_keydown_HostBindingHandler($event) {
        return ctx.onKeydown($event);
      }, \u0275\u0275resolveDocument);
    }
  }, decls: 1, vars: 1, consts: [["role", "dialog", "aria-modal", "true", "aria-label", "Visualizador de imagem", 1, "fixed", "inset-0", "z-100", "flex", "animate-fade-in", "items-center", "justify-center", "bg-ink-950/92", "p-4", "backdrop-blur-sm", "sm:p-8"], ["role", "dialog", "aria-modal", "true", "aria-label", "Visualizador de imagem", 1, "fixed", "inset-0", "z-100", "flex", "animate-fade-in", "items-center", "justify-center", "bg-ink-950/92", "p-4", "backdrop-blur-sm", "sm:p-8", 3, "click"], ["type", "button", "aria-label", "Fechar visualizador", 1, "absolute", "top-4", "right-4", "z-10", "grid", "size-11", "cursor-pointer", "place-items-center", "rounded-full", "bg-white/10", "text-white", "transition", "hover:bg-brand-600", "sm:top-6", "sm:right-6", 3, "click"], ["name", "close", 3, "size", "strokeWidth"], [1, "max-h-full", "w-full", "max-w-5xl"], ["type", "button", "aria-label", "Imagem anterior", 1, "absolute", "top-1/2", "left-3", "z-10", "grid", "size-11", "-translate-y-1/2", "cursor-pointer", "place-items-center", "rounded-full", "bg-white/10", "text-white", "transition", "hover:bg-brand-600", "sm:left-6", 3, "click"], ["name", "chevron-right", 1, "rotate-180", 3, "size", "strokeWidth"], ["type", "button", "aria-label", "Imagem seguinte", 1, "absolute", "top-1/2", "right-3", "z-10", "grid", "size-11", "-translate-y-1/2", "cursor-pointer", "place-items-center", "rounded-full", "bg-white/10", "text-white", "transition", "hover:bg-brand-600", "sm:right-6", 3, "click"], ["name", "chevron-right", 3, "size", "strokeWidth"], [1, "max-h-full", "w-full", "max-w-5xl", 3, "click"], ["sizes", "(min-width: 64rem) 62vw, 92vw", "imgClass", "mx-auto max-h-[78svh] w-auto rounded-lg object-contain shadow-2xl", 3, "image"], [1, "mt-4", "flex", "items-center", "justify-center", "gap-3", "text-sm", "text-bone-300"], [1, "text-bone-400", "tabular-nums"]], template: function Lightbox_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275conditionalCreate(0, Lightbox_Conditional_0_Template, 5, 4, "div", 0);
    }
    if (rf & 2) {
      \u0275\u0275conditional(ctx.lightbox.isOpen() ? 0 : -1);
    }
  }, dependencies: [Icon, ResponsiveImage], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Lightbox, [{
    type: Component,
    args: [{ selector: "app-lightbox", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon, ResponsiveImage], host: {
      "(document:keydown)": "onKeydown($event)"
    }, template: '@if (lightbox.isOpen()) {\n  <div\n    class="fixed inset-0 z-100 flex animate-fade-in items-center justify-center bg-ink-950/92 p-4 backdrop-blur-sm sm:p-8"\n    role="dialog"\n    aria-modal="true"\n    aria-label="Visualizador de imagem"\n    (click)="lightbox.close()"\n  >\n    <button\n      type="button"\n      (click)="lightbox.close()"\n      aria-label="Fechar visualizador"\n      class="absolute top-4 right-4 z-10 grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-brand-600 sm:top-6 sm:right-6"\n    >\n      <app-icon name="close" [size]="22" [strokeWidth]="2.25" />\n    </button>\n\n    @if (lightbox.total() > 1) {\n      <button\n        type="button"\n        (click)="lightbox.previous(); $event.stopPropagation()"\n        aria-label="Imagem anterior"\n        class="absolute top-1/2 left-3 z-10 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-brand-600 sm:left-6"\n      >\n        <app-icon name="chevron-right" [size]="22" [strokeWidth]="2.25" class="rotate-180" />\n      </button>\n      <button\n        type="button"\n        (click)="lightbox.next(); $event.stopPropagation()"\n        aria-label="Imagem seguinte"\n        class="absolute top-1/2 right-3 z-10 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-brand-600 sm:right-6"\n      >\n        <app-icon name="chevron-right" [size]="22" [strokeWidth]="2.25" />\n      </button>\n    }\n\n    @if (lightbox.current(); as image) {\n      <figure class="max-h-full w-full max-w-5xl" (click)="$event.stopPropagation()">\n        <app-responsive-image\n          [image]="image"\n          sizes="(min-width: 64rem) 62vw, 92vw"\n          imgClass="mx-auto max-h-[78svh] w-auto rounded-lg object-contain shadow-2xl"\n        />\n        <figcaption class="mt-4 flex items-center justify-center gap-3 text-sm text-bone-300">\n          @if (image.caption) {\n            <span>{{ image.caption }}</span>\n          }\n          @if (lightbox.total() > 1) {\n            <span class="text-bone-400 tabular-nums">{{ lightbox.position() }} / {{ lightbox.total() }}</span>\n          }\n        </figcaption>\n      </figure>\n    }\n  </div>\n}\n' }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Lightbox, { className: "Lightbox", filePath: "src/app/shared/components/lightbox/lightbox.ts", lineNumber: 22 });
})();

export {
  CookieNotice,
  ResponsiveImage,
  LightboxService,
  Lightbox,
  MapEmbed,
  OpeningHours,
  SocialLinks
};
//# sourceMappingURL=chunk-AL2QOPM3.js.map
