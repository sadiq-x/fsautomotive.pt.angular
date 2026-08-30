import {
  Accordion,
  AccordionItem,
  CtaBand,
  PageHero,
  PageSection,
  RevealDirective,
  SectionHeading,
  VehicleCard
} from "./chunk-A7H3SNWI.js";
import "./chunk-AL2QOPM3.js";
import "./chunk-NGHYTC22.js";
import {
  VEHICLE_TYPES
} from "./chunk-H4LGSLFV.js";
import {
  SERVICES,
  SITE
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
  ɵɵrepeaterTrackByIdentity,
  ɵɵsanitizeUrl,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-RUFDRP5X.js";

// src/app/features/services/services.ts
var _forTrack0 = ($index, $item) => $item.id;
function Services_For_6_For_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 14);
    \u0275\u0275element(1, "app-icon", 15);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const highlight_r1 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("size", 17)("strokeWidth", 2.5);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", highlight_r1, " ");
  }
}
function Services_For_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "app-accordion-item", 4)(1, "ul", 13);
    \u0275\u0275repeaterCreate(2, Services_For_6_For_3_Template, 3, 3, "li", 14, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const service_r2 = ctx.$implicit;
    \u0275\u0275property("itemId", service_r2.id)("title", service_r2.title)("summary", service_r2.description)("icon", service_r2.icon);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(service_r2.highlights);
  }
}
function Services_For_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 10);
    \u0275\u0275element(1, "app-vehicle-card", 16);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const vehicle_r3 = ctx.$implicit;
    const $index_r4 = ctx.$index;
    \u0275\u0275property("revealDelay", $index_r4 * 60);
    \u0275\u0275advance();
    \u0275\u0275property("vehicle", vehicle_r3);
  }
}
var Services = class _Services {
  site = SITE;
  services = SERVICES;
  vehicles = VEHICLE_TYPES;
  static \u0275fac = function Services_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Services)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Services, selectors: [["app-services"]], decls: 19, vars: 1, consts: [["eyebrow", "Os nossos servi\xE7os", "title", "Tudo o que a sua viatura precisa, no mesmo s\xEDtio", "lead", "Da revis\xE3o de rotina \xE0 repara\xE7\xE3o p\xF3s-colis\xE3o. Toque num servi\xE7o para ver exatamente o que est\xE1 inclu\xEDdo."], ["tone", "bone"], [1, "mx-auto", "max-w-4xl"], ["appReveal", "", 1, "rounded-3xl", "bg-white", "p-4", "shadow-card", "sm:p-8"], [3, "itemId", "title", "summary", "icon"], [1, "mt-8", "text-center", "text-body", "text-ink-500"], [1, "font-semibold", "text-brand-700", "underline-offset-4", "hover:underline", 3, "href"], ["tone", "white", "sectionId", "veiculos"], ["eyebrow", "Multimarca", "title", "Tipos de ve\xEDculos que recebemos", "lead", "Trabalhamos com ligeiros, comerciais, todo-o-terreno, cl\xE1ssicos e desportivos \u2014 todas as marcas, sem exce\xE7\xF5es.", "appReveal", ""], [1, "mt-14", "grid", "grid-cols-2", "gap-4", "sm:grid-cols-3", "lg:grid-cols-5"], ["appReveal", "", 3, "revealDelay"], ["tone", "bone", "spacing", "sm"], ["title", "Pe\xE7a o seu or\xE7amento", "lead", "Descreva-nos o problema ou o servi\xE7o que procura. Damos-lhe resposta com prazos e valores claros, antes de qualquer interven\xE7\xE3o."], [1, "grid", "gap-2.5", "sm:grid-cols-2"], [1, "flex", "items-start", "gap-2.5", "text-body", "text-ink-700"], ["name", "check", 1, "mt-0.5", "shrink-0", "text-brand-600", 3, "size", "strokeWidth"], [3, "vehicle"]], template: function Services_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275element(0, "app-page-hero", 0);
      \u0275\u0275elementStart(1, "app-page-section", 1)(2, "div", 2)(3, "div", 3)(4, "app-accordion");
      \u0275\u0275repeaterCreate(5, Services_For_6_Template, 4, 4, "app-accordion-item", 4, _forTrack0);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(7, "p", 5);
      \u0275\u0275text(8, " N\xE3o encontrou o que procura? ");
      \u0275\u0275elementStart(9, "a", 6);
      \u0275\u0275text(10, "Ligue-nos");
      \u0275\u0275elementEnd();
      \u0275\u0275text(11, " \u2014 se for autom\xF3vel, provavelmente resolvemos. ");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(12, "app-page-section", 7);
      \u0275\u0275element(13, "app-section-heading", 8);
      \u0275\u0275elementStart(14, "ul", 9);
      \u0275\u0275repeaterCreate(15, Services_For_16_Template, 2, 2, "li", 10, _forTrack0);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(17, "app-page-section", 11);
      \u0275\u0275element(18, "app-cta-band", 12);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance(5);
      \u0275\u0275repeater(ctx.services);
      \u0275\u0275advance(4);
      \u0275\u0275property("href", ctx.site.phone.href, \u0275\u0275sanitizeUrl);
      \u0275\u0275advance(6);
      \u0275\u0275repeater(ctx.vehicles);
    }
  }, dependencies: [
    Accordion,
    AccordionItem,
    CtaBand,
    Icon,
    PageHero,
    PageSection,
    RevealDirective,
    SectionHeading,
    VehicleCard
  ], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Services, [{
    type: Component,
    args: [{ selector: "app-services", changeDetection: ChangeDetectionStrategy.OnPush, imports: [
      Accordion,
      AccordionItem,
      CtaBand,
      Icon,
      PageHero,
      PageSection,
      RevealDirective,
      SectionHeading,
      VehicleCard
    ], template: '<app-page-hero\n  eyebrow="Os nossos servi\xE7os"\n  title="Tudo o que a sua viatura precisa, no mesmo s\xEDtio"\n  lead="Da revis\xE3o de rotina \xE0 repara\xE7\xE3o p\xF3s-colis\xE3o. Toque num servi\xE7o para ver exatamente o que est\xE1 inclu\xEDdo."\n/>\n\n<!-- ========================================================== Cat\xE1logo === -->\n<app-page-section tone="bone">\n  <div class="mx-auto max-w-4xl">\n    <div class="rounded-3xl bg-white p-4 shadow-card sm:p-8" appReveal>\n      <app-accordion>\n        @for (service of services; track service.id) {\n          <app-accordion-item\n            [itemId]="service.id"\n            [title]="service.title"\n            [summary]="service.description"\n            [icon]="service.icon"\n          >\n            <ul class="grid gap-2.5 sm:grid-cols-2">\n              @for (highlight of service.highlights; track highlight) {\n                <li class="flex items-start gap-2.5 text-body text-ink-700">\n                  <app-icon\n                    name="check"\n                    [size]="17"\n                    [strokeWidth]="2.5"\n                    class="mt-0.5 shrink-0 text-brand-600"\n                  />\n                  {{ highlight }}\n                </li>\n              }\n            </ul>\n          </app-accordion-item>\n        }\n      </app-accordion>\n    </div>\n\n    <p class="mt-8 text-center text-body text-ink-500">\n      N\xE3o encontrou o que procura?\n      <a [href]="site.phone.href" class="font-semibold text-brand-700 underline-offset-4 hover:underline"\n        >Ligue-nos</a\n      >\n      \u2014 se for autom\xF3vel, provavelmente resolvemos.\n    </p>\n  </div>\n</app-page-section>\n\n<!-- =========================================================== Ve\xEDculos === -->\n<app-page-section tone="white" sectionId="veiculos">\n  <app-section-heading\n    eyebrow="Multimarca"\n    title="Tipos de ve\xEDculos que recebemos"\n    lead="Trabalhamos com ligeiros, comerciais, todo-o-terreno, cl\xE1ssicos e desportivos \u2014 todas as marcas, sem exce\xE7\xF5es."\n    appReveal\n  />\n\n  <ul class="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">\n    @for (vehicle of vehicles; track vehicle.id) {\n      <li appReveal [revealDelay]="$index * 60">\n        <app-vehicle-card [vehicle]="vehicle" />\n      </li>\n    }\n  </ul>\n</app-page-section>\n\n<!-- ================================================================ CTA === -->\n<app-page-section tone="bone" spacing="sm">\n  <app-cta-band\n    title="Pe\xE7a o seu or\xE7amento"\n    lead="Descreva-nos o problema ou o servi\xE7o que procura. Damos-lhe resposta com prazos e valores claros, antes de qualquer interven\xE7\xE3o."\n  />\n</app-page-section>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Services, { className: "Services", filePath: "src/app/features/services/services.ts", lineNumber: 33 });
})();
export {
  Services
};
//# sourceMappingURL=chunk-QBPWHLSR.js.map
