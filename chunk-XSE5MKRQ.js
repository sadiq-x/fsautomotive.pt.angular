import {
  ContactChannels,
  PageHero,
  PageSection,
  RevealDirective,
  SectionHeading
} from "./chunk-A7H3SNWI.js";
import {
  MapEmbed,
  OpeningHours,
  SocialLinks
} from "./chunk-AL2QOPM3.js";
import {
  UiButton
} from "./chunk-NGHYTC22.js";
import "./chunk-H4LGSLFV.js";
import {
  CALL_ACTION,
  DIRECTIONS_ACTION,
  EMAIL_ACTION,
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
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-RUFDRP5X.js";

// src/app/features/contact/contact.ts
var Contact = class _Contact {
  site = SITE;
  callAction = CALL_ACTION;
  emailAction = EMAIL_ACTION;
  directionsAction = DIRECTIONS_ACTION;
  static \u0275fac = function Contact_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Contact)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Contact, selectors: [["app-contact"]], decls: 34, vars: 10, consts: [["eyebrow", "Contactos", "title", "Falamos consigo antes de tocar no carro", "lead", "Ligue, escreva ou apare\xE7a. Explicamos o que a sua viatura precisa em linguagem simples e sem compromisso."], [1, "mt-9", "flex", "flex-col", "gap-3", "sm:flex-row"], ["variant", "primary", "size", "lg", "iconPosition", "left", 3, "action"], ["variant", "ghost", "size", "lg", "iconPosition", "left", 3, "action"], ["tone", "bone"], ["eyebrow", "Como nos encontrar", "title", "Escolha o canal que lhe der mais jeito", "appReveal", ""], ["appReveal", "", 1, "mt-14"], ["tone", "white", "sectionId", "onde-estamos"], [1, "grid", "gap-12", "lg:grid-cols-12", "lg:gap-16"], [1, "lg:col-span-5"], ["align", "left", "eyebrow", "Onde estamos", "title", "Rua do Olival Santo 16b, Vialonga", "lead", "Ficamos em Vialonga, com acesso r\xE1pido a partir de Alverca, Vila Franca de Xira e Loures. Estacionamento pr\xF3prio para clientes.", "appReveal", ""], [1, "mt-8", "rounded-2xl", "bg-bone-100", "p-6", "text-sm", "leading-relaxed", "text-ink-700", "not-italic"], [1, "flex", "items-start", "gap-3"], ["name", "map-pin", 1, "mt-0.5", "shrink-0", "text-brand-600", 3, "size"], [1, "block", "font-bold", "text-ink-950"], ["variant", "dark", "iconPosition", "left", 1, "mt-6", 3, "action"], [1, "mt-10"], [1, "flex", "items-center", "gap-2", "text-sm", "font-bold", "tracking-tight", "text-ink-950"], ["name", "clock", 1, "text-brand-600", 3, "size"], [1, "mt-2"], [1, "text-xs", "font-bold", "tracking-[0.16em]", "text-ink-400", "uppercase"], ["tone", "light", 1, "mt-4"], ["appReveal", "", 1, "lg:col-span-7"], ["frameClass", "aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-125"]], template: function Contact_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "app-page-hero", 0)(1, "div", 1);
      \u0275\u0275element(2, "app-button", 2)(3, "app-button", 3);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(4, "app-page-section", 4);
      \u0275\u0275element(5, "app-section-heading", 5)(6, "app-contact-channels", 6);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "app-page-section", 7)(8, "div", 8)(9, "div", 9);
      \u0275\u0275element(10, "app-section-heading", 10);
      \u0275\u0275elementStart(11, "address", 11)(12, "span", 12);
      \u0275\u0275element(13, "app-icon", 13);
      \u0275\u0275elementStart(14, "span")(15, "strong", 14);
      \u0275\u0275text(16);
      \u0275\u0275elementEnd();
      \u0275\u0275text(17);
      \u0275\u0275element(18, "br");
      \u0275\u0275text(19);
      \u0275\u0275element(20, "br");
      \u0275\u0275text(21);
      \u0275\u0275elementEnd()()();
      \u0275\u0275element(22, "app-button", 15);
      \u0275\u0275elementStart(23, "div", 16)(24, "h3", 17);
      \u0275\u0275element(25, "app-icon", 18);
      \u0275\u0275text(26, " Hor\xE1rio de funcionamento ");
      \u0275\u0275elementEnd();
      \u0275\u0275element(27, "app-opening-hours", 19);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(28, "div", 16)(29, "h3", 20);
      \u0275\u0275text(30, "Siga-nos");
      \u0275\u0275elementEnd();
      \u0275\u0275element(31, "app-social-links", 21);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(32, "div", 22);
      \u0275\u0275element(33, "app-map-embed", 23);
      \u0275\u0275elementEnd()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275property("action", ctx.callAction);
      \u0275\u0275advance();
      \u0275\u0275property("action", ctx.emailAction);
      \u0275\u0275advance(10);
      \u0275\u0275property("size", 18);
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.site.name);
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.site.address.street);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate2(" ", ctx.site.address.postalCode, " ", ctx.site.address.city);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" ", ctx.site.address.country, " ");
      \u0275\u0275advance();
      \u0275\u0275property("action", ctx.directionsAction);
      \u0275\u0275advance(3);
      \u0275\u0275property("size", 18);
    }
  }, dependencies: [
    ContactChannels,
    Icon,
    MapEmbed,
    OpeningHours,
    PageHero,
    PageSection,
    RevealDirective,
    SectionHeading,
    SocialLinks,
    UiButton
  ], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Contact, [{
    type: Component,
    args: [{ selector: "app-contact", changeDetection: ChangeDetectionStrategy.OnPush, imports: [
      ContactChannels,
      Icon,
      MapEmbed,
      OpeningHours,
      PageHero,
      PageSection,
      RevealDirective,
      SectionHeading,
      SocialLinks,
      UiButton
    ], template: '<app-page-hero\n  eyebrow="Contactos"\n  title="Falamos consigo antes de tocar no carro"\n  lead="Ligue, escreva ou apare\xE7a. Explicamos o que a sua viatura precisa em linguagem simples e sem compromisso."\n>\n  <div class="mt-9 flex flex-col gap-3 sm:flex-row">\n    <app-button [action]="callAction" variant="primary" size="lg" iconPosition="left" />\n    <app-button [action]="emailAction" variant="ghost" size="lg" iconPosition="left" />\n  </div>\n</app-page-hero>\n\n<!-- =========================================================== Canais === -->\n<app-page-section tone="bone">\n  <app-section-heading\n    eyebrow="Como nos encontrar"\n    title="Escolha o canal que lhe der mais jeito"\n    appReveal\n  />\n\n  <app-contact-channels class="mt-14" appReveal />\n</app-page-section>\n\n<!-- =========================================================== Morada === -->\n<app-page-section tone="white" sectionId="onde-estamos">\n  <div class="grid gap-12 lg:grid-cols-12 lg:gap-16">\n    <div class="lg:col-span-5">\n      <app-section-heading\n        align="left"\n        eyebrow="Onde estamos"\n        title="Rua do Olival Santo 16b, Vialonga"\n        lead="Ficamos em Vialonga, com acesso r\xE1pido a partir de Alverca, Vila Franca de Xira e Loures. Estacionamento pr\xF3prio para clientes."\n        appReveal\n      />\n\n      <address class="mt-8 rounded-2xl bg-bone-100 p-6 text-sm leading-relaxed text-ink-700 not-italic">\n        <span class="flex items-start gap-3">\n          <app-icon name="map-pin" [size]="18" class="mt-0.5 shrink-0 text-brand-600" />\n          <span>\n            <strong class="block font-bold text-ink-950">{{ site.name }}</strong>\n            {{ site.address.street }}<br />\n            {{ site.address.postalCode }} {{ site.address.city }}<br />\n            {{ site.address.country }}\n          </span>\n        </span>\n      </address>\n\n      <app-button [action]="directionsAction" variant="dark" iconPosition="left" class="mt-6" />\n\n      <div class="mt-10">\n        <h3 class="flex items-center gap-2 text-sm font-bold tracking-tight text-ink-950">\n          <app-icon name="clock" [size]="18" class="text-brand-600" />\n          Hor\xE1rio de funcionamento\n        </h3>\n        <app-opening-hours class="mt-2" />\n      </div>\n\n      <div class="mt-10">\n        <h3 class="text-xs font-bold tracking-[0.16em] text-ink-400 uppercase">Siga-nos</h3>\n        <app-social-links class="mt-4" tone="light" />\n      </div>\n    </div>\n\n    <div class="lg:col-span-7" appReveal>\n      <app-map-embed frameClass="aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-125" />\n    </div>\n  </div>\n</app-page-section>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Contact, { className: "Contact", filePath: "src/app/features/contact/contact.ts", lineNumber: 35 });
})();
export {
  Contact
};
//# sourceMappingURL=chunk-XSE5MKRQ.js.map
