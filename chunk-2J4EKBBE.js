import {
  PageSection
} from "./chunk-A7H3SNWI.js";
import "./chunk-AL2QOPM3.js";
import {
  UiButton
} from "./chunk-NGHYTC22.js";
import {
  NAV_LINKS
} from "./chunk-H4LGSLFV.js";
import {
  CALL_ACTION
} from "./chunk-UVBD33FH.js";
import {
  Icon
} from "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-RUFDRP5X.js";

// src/app/features/not-found/not-found.ts
var _forTrack0 = ($index, $item) => $item.path;
function NotFound_For_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li")(1, "app-button", 11);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const link_r1 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("routerLink", link_r1.path)("icon", link_r1.icon);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(link_r1.label);
  }
}
var NotFound = class _NotFound {
  callAction = CALL_ACTION;
  links = NAV_LINKS.filter((link) => !link.exact);
  static \u0275fac = function NotFound_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NotFound)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _NotFound, selectors: [["app-not-found"]], decls: 17, vars: 2, consts: [["tone", "bone", "spacing", "lg"], [1, "mx-auto", "max-w-2xl", "text-center"], [1, "mx-auto", "grid", "size-16", "place-items-center", "rounded-2xl", "bg-brand-50", "text-brand-600"], ["name", "wrench", 3, "size"], [1, "mt-8", "text-7xl", "font-black", "tracking-tight", "text-ink-950/10", "tabular-nums", "sm:text-8xl"], [1, "mt-2", "text-h1", "font-extrabold", "text-ink-950"], [1, "mt-5", "text-lead", "text-ink-600"], [1, "mt-10", "flex", "flex-col", "justify-center", "gap-3", "sm:flex-row"], ["routerLink", "/", "variant", "primary", "size", "lg", "icon", "arrow-right"], ["variant", "secondary", "size", "lg", "iconPosition", "left", 3, "action"], [1, "mt-12", "flex", "flex-wrap", "justify-center", "gap-2"], ["variant", "secondary", "size", "sm", "iconPosition", "left", 3, "routerLink", "icon"]], template: function NotFound_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "app-page-section", 0)(1, "div", 1)(2, "span", 2);
      \u0275\u0275element(3, "app-icon", 3);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(4, "p", 4);
      \u0275\u0275text(5, "404");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "h1", 5);
      \u0275\u0275text(7, "Esta p\xE1gina saiu para repara\xE7\xE3o");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(8, "p", 6);
      \u0275\u0275text(9, " O endere\xE7o que procura n\xE3o existe ou foi movido. Use os atalhos abaixo \u2014 ou ligue-nos e dizemos-lhe o que precisa de saber. ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(10, "div", 7)(11, "app-button", 8);
      \u0275\u0275text(12, "Voltar ao in\xEDcio");
      \u0275\u0275elementEnd();
      \u0275\u0275element(13, "app-button", 9);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(14, "ul", 10);
      \u0275\u0275repeaterCreate(15, NotFound_For_16_Template, 3, 3, "li", null, _forTrack0);
      \u0275\u0275elementEnd()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(3);
      \u0275\u0275property("size", 30);
      \u0275\u0275advance(10);
      \u0275\u0275property("action", ctx.callAction);
      \u0275\u0275advance(2);
      \u0275\u0275repeater(ctx.links);
    }
  }, dependencies: [Icon, PageSection, UiButton], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NotFound, [{
    type: Component,
    args: [{ selector: "app-not-found", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon, PageSection, UiButton], template: '<app-page-section tone="bone" spacing="lg">\n  <div class="mx-auto max-w-2xl text-center">\n    <span class="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">\n      <app-icon name="wrench" [size]="30" />\n    </span>\n\n    <p class="mt-8 text-7xl font-black tracking-tight text-ink-950/10 tabular-nums sm:text-8xl">404</p>\n    <h1 class="mt-2 text-h1 font-extrabold text-ink-950">Esta p\xE1gina saiu para repara\xE7\xE3o</h1>\n    <p class="mt-5 text-lead text-ink-600">\n      O endere\xE7o que procura n\xE3o existe ou foi movido. Use os atalhos abaixo \u2014 ou ligue-nos e dizemos-lhe o\n      que precisa de saber.\n    </p>\n\n    <div class="mt-10 flex flex-col justify-center gap-3 sm:flex-row">\n      <app-button routerLink="/" variant="primary" size="lg" icon="arrow-right">Voltar ao in\xEDcio</app-button>\n      <app-button [action]="callAction" variant="secondary" size="lg" iconPosition="left" />\n    </div>\n\n    <ul class="mt-12 flex flex-wrap justify-center gap-2">\n      @for (link of links; track link.path) {\n        <li>\n          <app-button\n            [routerLink]="link.path"\n            variant="secondary"\n            size="sm"\n            [icon]="link.icon"\n            iconPosition="left"\n            >{{ link.label }}</app-button\n          >\n        </li>\n      }\n    </ul>\n  </div>\n</app-page-section>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(NotFound, { className: "NotFound", filePath: "src/app/features/not-found/not-found.ts", lineNumber: 13 });
})();
export {
  NotFound
};
//# sourceMappingURL=chunk-2J4EKBBE.js.map
