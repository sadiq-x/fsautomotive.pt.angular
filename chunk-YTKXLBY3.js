import {
  Carousel,
  CtaBand,
  FeatureCard,
  GalleryGrid,
  PageSection,
  RevealDirective,
  SectionHeading,
  VehicleCard
} from "./chunk-A7H3SNWI.js";
import {
  OpeningHours
} from "./chunk-AL2QOPM3.js";
import {
  UiButton
} from "./chunk-NGHYTC22.js";
import {
  BRAND_VALUES,
  HERO_SLIDES,
  VEHICLE_TYPES,
  WORKSHOP_GALLERY
} from "./chunk-H4LGSLFV.js";
import {
  CALL_ACTION,
  SERVICES,
  SITE
} from "./chunk-UVBD33FH.js";
import {
  Icon
} from "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  RouterLink,
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
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-RUFDRP5X.js";

// src/app/features/home/home.ts
var _forTrack0 = ($index, $item) => $item.title;
var _forTrack1 = ($index, $item) => $item.id;
function Home_For_55_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-feature-card", 24);
  }
  if (rf & 2) {
    const value_r1 = ctx.$implicit;
    const $index_r2 = ctx.$index;
    \u0275\u0275property("feature", value_r1)("index", $index_r2 + 1)("revealDelay", $index_r2 * 90);
  }
}
function Home_For_63_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 30)(1, "a", 44)(2, "span", 45);
    \u0275\u0275element(3, "app-icon", 46);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "h3", 47);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "p", 48);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "span", 49);
    \u0275\u0275text(9, " Saber mais ");
    \u0275\u0275element(10, "app-icon", 50);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const service_r3 = ctx.$implicit;
    const $index_r4 = ctx.$index;
    \u0275\u0275property("revealDelay", $index_r4 * 60);
    \u0275\u0275advance();
    \u0275\u0275property("fragment", service_r3.id);
    \u0275\u0275advance(2);
    \u0275\u0275property("name", service_r3.icon)("size", 24);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", service_r3.title, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", service_r3.description, " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("size", 16);
  }
}
function Home_For_68_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 30);
    \u0275\u0275element(1, "app-vehicle-card", 51);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const vehicle_r5 = ctx.$implicit;
    const $index_r6 = ctx.$index;
    \u0275\u0275property("revealDelay", $index_r6 * 60);
    \u0275\u0275advance();
    \u0275\u0275property("vehicle", vehicle_r5);
  }
}
var Home = class _Home {
  site = SITE;
  slides = HERO_SLIDES;
  values = BRAND_VALUES;
  vehicles = VEHICLE_TYPES;
  gallery = WORKSHOP_GALLERY;
  callAction = CALL_ACTION;
  /** The first six services, as a teaser for the full catalogue. */
  featuredServices = SERVICES.slice(0, 6);
  totalServices = SERVICES.length;
  static \u0275fac = function Home_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Home)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Home, selectors: [["app-home"]], decls: 84, vars: 13, consts: [[1, "relative", "isolate", "flex", "min-h-[min(88svh,50rem)]", "items-center", "bg-ink-950", "short:min-h-0"], [1, "absolute", "inset-0"], [1, "h-full", 3, "slides", "interval", "showControls", "eager"], ["aria-hidden", "true", 1, "absolute", "inset-0", "bg-ink-950/78", "lg:bg-transparent", "lg:bg-linear-to-r", "lg:from-ink-950", "lg:from-6%", "lg:via-ink-950/80", "lg:via-46%", "lg:to-ink-950/25"], ["aria-hidden", "true", 1, "absolute", "inset-x-0", "bottom-0", "h-1", "bg-brand-600"], [1, "relative", "container-page", "w-full", "py-section-lg", "short:py-12"], [1, "max-w-3xl"], [1, "inline-flex", "items-center", "gap-2", "rounded-full", "bg-white/8", "px-4", "py-1.5", "text-eyebrow", "text-brand-400", "uppercase", "ring-1", "ring-white/15", "backdrop-blur-sm", "ring-inset"], ["name", "map-pin", 3, "size"], [1, "mt-7", "text-display", "font-extrabold", "text-white"], [1, "text-brand-500"], [1, "mt-7", "max-w-2xl", "text-lead", "text-bone-200"], [1, "font-bold", "text-white"], [1, "mt-10", "flex", "flex-col", "gap-3", "sm:flex-row", "sm:items-center"], ["variant", "primary", "size", "lg", "iconPosition", "left", 3, "action"], ["routerLink", "/servicos", "variant", "ghost", "size", "lg", "icon", "arrow-right"], [1, "mt-14", "grid", "max-w-lg", "grid-cols-3", "gap-6", "border-t", "border-white/12", "pt-8", "short:hidden"], [1, "sr-only"], [1, "text-h2", "font-extrabold", "text-white", "tabular-nums"], [1, "mt-1", "text-meta", "font-medium", "text-bone-400"], [1, "text-h2", "font-extrabold", "text-white"], ["tone", "bone"], ["eyebrow", "Porque nos escolhem", "title", "A sua satisfa\xE7\xE3o \xE9 a nossa maior prioridade", "lead", "Tr\xEAs compromissos que assumimos em cada viatura que entra na nossa oficina.", "appReveal", ""], [1, "mt-14", "grid", "gap-6", "md:grid-cols-3"], ["appReveal", "", 3, "feature", "index", "revealDelay"], ["tone", "white"], [1, "flex", "flex-col", "gap-8", "lg:flex-row", "lg:items-end", "lg:justify-between"], ["align", "left", "eyebrow", "O que fazemos", "title", "Da manuten\xE7\xE3o corrente \xE0 repara\xE7\xE3o complexa", "lead", "Uma oficina multimarca completa, com equipamento de diagn\xF3stico e t\xE9cnicos especializados.", "appReveal", ""], ["routerLink", "/servicos", "variant", "dark", "icon", "arrow-right", 1, "shrink-0"], [1, "mt-14", "grid", "gap-4", "sm:grid-cols-2", "lg:grid-cols-3"], ["appReveal", "", 3, "revealDelay"], ["eyebrow", "Sem exclusividades", "title", "Que ve\xEDculos recebemos", "lead", "Do utilit\xE1rio do dia a dia ao cl\xE1ssico de estima\xE7\xE3o \u2014 trabalhamos com todas as marcas.", "appReveal", ""], [1, "mt-14", "grid", "grid-cols-2", "gap-4", "sm:grid-cols-3", "lg:grid-cols-5"], [1, "grid", "gap-12", "lg:grid-cols-12", "lg:gap-16"], [1, "lg:col-span-5"], ["align", "left", "eyebrow", "A oficina", "title", "Equipamento a s\xE9rio, num espa\xE7o pensado para si", "lead", "Investimos continuamente em tecnologia e nas melhores pr\xE1ticas do setor. Enquanto cuidamos do seu ve\xEDculo, tem parque pr\xF3prio e uma sala de espera confort\xE1vel \xE0 sua disposi\xE7\xE3o.", "appReveal", ""], [1, "mt-9", "rounded-2xl", "bg-bone-100", "p-6"], [1, "flex", "items-center", "gap-2", "text-sm", "font-bold", "tracking-tight", "text-ink-950"], ["name", "clock", 1, "text-brand-600", 3, "size"], [1, "mt-2"], ["routerLink", "/sobre-nos", "variant", "dark", "icon", "arrow-right", 1, "mt-8"], ["appReveal", "", 1, "lg:col-span-7"], [3, "images", "columns"], ["tone", "bone", "spacing", "sm"], ["routerLink", "/servicos", 1, "group", "flex", "h-full", "flex-col", "rounded-2xl", "bg-bone-100", "p-7", "transition-all", "duration-300", "ease-out", "hover:-translate-y-1", "hover:bg-ink-950", "hover:shadow-card-hover", 3, "fragment"], [1, "grid", "size-12", "place-items-center", "rounded-xl", "bg-white", "text-brand-600", "shadow-sm", "transition-colors", "duration-300", "group-hover:bg-brand-600", "group-hover:text-white"], [3, "name", "size"], [1, "mt-6", "text-h3", "font-bold", "text-ink-950", "transition-colors", "duration-300", "group-hover:text-white"], [1, "mt-2.5", "flex-1", "text-body", "text-ink-600", "transition-colors", "duration-300", "group-hover:text-bone-300"], [1, "mt-6", "inline-flex", "items-center", "gap-1.5", "text-sm", "font-semibold", "text-brand-600", "transition-colors", "duration-300", "group-hover:text-brand-400"], ["name", "arrow-right", 1, "transition-transform", "duration-200", "group-hover:translate-x-1", 3, "size"], [3, "vehicle"]], template: function Home_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "section", 0)(1, "div", 1);
      \u0275\u0275element(2, "app-carousel", 2);
      \u0275\u0275elementEnd();
      \u0275\u0275element(3, "div", 3)(4, "span", 4);
      \u0275\u0275elementStart(5, "div", 5)(6, "div", 6)(7, "p", 7);
      \u0275\u0275element(8, "app-icon", 8);
      \u0275\u0275text(9);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(10, "h1", 9);
      \u0275\u0275text(11, " Cuidamos do seu ve\xEDculo ");
      \u0275\u0275elementStart(12, "span", 10);
      \u0275\u0275text(13, "como se fosse nosso.");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(14, "p", 11);
      \u0275\u0275text(15);
      \u0275\u0275elementStart(16, "strong", 12);
      \u0275\u0275text(17, "qualidade");
      \u0275\u0275elementEnd();
      \u0275\u0275text(18, ", ");
      \u0275\u0275elementStart(19, "strong", 12);
      \u0275\u0275text(20, "efici\xEAncia");
      \u0275\u0275elementEnd();
      \u0275\u0275text(21, " e um ");
      \u0275\u0275elementStart(22, "strong", 12);
      \u0275\u0275text(23, "atendimento personalizado");
      \u0275\u0275elementEnd();
      \u0275\u0275text(24, " \u2014 do diagn\xF3stico \xE0 entrega. ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(25, "div", 13);
      \u0275\u0275element(26, "app-button", 14);
      \u0275\u0275elementStart(27, "app-button", 15);
      \u0275\u0275text(28, "Ver os nossos servi\xE7os");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(29, "dl", 16)(30, "div")(31, "dt", 17);
      \u0275\u0275text(32, "Servi\xE7os dispon\xEDveis");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(33, "dd", 18);
      \u0275\u0275text(34);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(35, "p", 19);
      \u0275\u0275text(36, "Servi\xE7os especializados");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(37, "div")(38, "dt", 17);
      \u0275\u0275text(39, "Tipos de ve\xEDculos");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(40, "dd", 18);
      \u0275\u0275text(41);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(42, "p", 19);
      \u0275\u0275text(43, "Tipos de ve\xEDculo");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(44, "div")(45, "dt", 17);
      \u0275\u0275text(46, "Abordagem");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(47, "dd", 20);
      \u0275\u0275text(48, "100%");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(49, "p", 19);
      \u0275\u0275text(50, "Multimarca");
      \u0275\u0275elementEnd()()()()()();
      \u0275\u0275elementStart(51, "app-page-section", 21);
      \u0275\u0275element(52, "app-section-heading", 22);
      \u0275\u0275elementStart(53, "div", 23);
      \u0275\u0275repeaterCreate(54, Home_For_55_Template, 1, 3, "app-feature-card", 24, _forTrack0);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(56, "app-page-section", 25)(57, "div", 26);
      \u0275\u0275element(58, "app-section-heading", 27);
      \u0275\u0275elementStart(59, "app-button", 28);
      \u0275\u0275text(60, "Todos os servi\xE7os");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(61, "ul", 29);
      \u0275\u0275repeaterCreate(62, Home_For_63_Template, 11, 7, "li", 30, _forTrack1);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(64, "app-page-section", 21);
      \u0275\u0275element(65, "app-section-heading", 31);
      \u0275\u0275elementStart(66, "ul", 32);
      \u0275\u0275repeaterCreate(67, Home_For_68_Template, 2, 2, "li", 30, _forTrack1);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(69, "app-page-section", 25)(70, "div", 33)(71, "div", 34);
      \u0275\u0275element(72, "app-section-heading", 35);
      \u0275\u0275elementStart(73, "div", 36)(74, "h3", 37);
      \u0275\u0275element(75, "app-icon", 38);
      \u0275\u0275text(76, " Hor\xE1rio de funcionamento ");
      \u0275\u0275elementEnd();
      \u0275\u0275element(77, "app-opening-hours", 39);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(78, "app-button", 40);
      \u0275\u0275text(79, "Conhecer a FS Automotive");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(80, "div", 41);
      \u0275\u0275element(81, "app-gallery-grid", 42);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(82, "app-page-section", 43);
      \u0275\u0275element(83, "app-cta-band");
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275property("slides", ctx.slides)("interval", 6e3)("showControls", false)("eager", true);
      \u0275\u0275advance(6);
      \u0275\u0275property("size", 14);
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.site.tagline, " ");
      \u0275\u0275advance(6);
      \u0275\u0275textInterpolate1(" Est\xE1 \xE0 procura de um servi\xE7o autom\xF3vel de confian\xE7a? A ", ctx.site.name, " garante-lhe ");
      \u0275\u0275advance(11);
      \u0275\u0275property("action", ctx.callAction);
      \u0275\u0275advance(8);
      \u0275\u0275textInterpolate(ctx.totalServices);
      \u0275\u0275advance(7);
      \u0275\u0275textInterpolate(ctx.vehicles.length);
      \u0275\u0275advance(13);
      \u0275\u0275repeater(ctx.values);
      \u0275\u0275advance(8);
      \u0275\u0275repeater(ctx.featuredServices);
      \u0275\u0275advance(5);
      \u0275\u0275repeater(ctx.vehicles);
      \u0275\u0275advance(8);
      \u0275\u0275property("size", 18);
      \u0275\u0275advance(6);
      \u0275\u0275property("images", ctx.gallery)("columns", 2);
    }
  }, dependencies: [
    RouterLink,
    Carousel,
    CtaBand,
    FeatureCard,
    GalleryGrid,
    Icon,
    OpeningHours,
    PageSection,
    RevealDirective,
    SectionHeading,
    UiButton,
    VehicleCard
  ], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Home, [{
    type: Component,
    args: [{ selector: "app-home", changeDetection: ChangeDetectionStrategy.OnPush, imports: [
      RouterLink,
      Carousel,
      CtaBand,
      FeatureCard,
      GalleryGrid,
      Icon,
      OpeningHours,
      PageSection,
      RevealDirective,
      SectionHeading,
      UiButton,
      VehicleCard
    ], template: '<!-- ============================================================== Hero === -->\n<section class="relative isolate flex min-h-[min(88svh,50rem)] items-center bg-ink-950 short:min-h-0">\n  <div class="absolute inset-0">\n    <app-carousel class="h-full" [slides]="slides" [interval]="6000" [showControls]="false" [eager]="true" />\n  </div>\n  <div\n    class="absolute inset-0 bg-ink-950/78 lg:bg-transparent lg:bg-linear-to-r lg:from-ink-950 lg:from-6% lg:via-ink-950/80 lg:via-46% lg:to-ink-950/25"\n    aria-hidden="true"\n  ></div>\n  <span class="absolute inset-x-0 bottom-0 h-1 bg-brand-600" aria-hidden="true"></span>\n\n  <div class="relative container-page w-full py-section-lg short:py-12">\n    <div class="max-w-3xl">\n      <p\n        class="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-1.5 text-eyebrow text-brand-400 uppercase ring-1 ring-white/15 backdrop-blur-sm ring-inset"\n      >\n        <app-icon name="map-pin" [size]="14" />\n        {{ site.tagline }}\n      </p>\n\n      <h1 class="mt-7 text-display font-extrabold text-white">\n        Cuidamos do seu ve\xEDculo\n        <span class="text-brand-500">como se fosse nosso.</span>\n      </h1>\n\n      <p class="mt-7 max-w-2xl text-lead text-bone-200">\n        Est\xE1 \xE0 procura de um servi\xE7o autom\xF3vel de confian\xE7a? A {{ site.name }} garante-lhe\n        <strong class="font-bold text-white">qualidade</strong>,\n        <strong class="font-bold text-white">efici\xEAncia</strong> e um\n        <strong class="font-bold text-white">atendimento personalizado</strong> \u2014 do diagn\xF3stico \xE0 entrega.\n      </p>\n\n      <div class="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">\n        <app-button [action]="callAction" variant="primary" size="lg" iconPosition="left" />\n        <app-button routerLink="/servicos" variant="ghost" size="lg" icon="arrow-right"\n          >Ver os nossos servi\xE7os</app-button\n        >\n      </div>\n\n      <dl class="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-white/12 pt-8 short:hidden">\n        <div>\n          <dt class="sr-only">Servi\xE7os dispon\xEDveis</dt>\n          <dd class="text-h2 font-extrabold text-white tabular-nums">{{ totalServices }}</dd>\n          <p class="mt-1 text-meta font-medium text-bone-400">Servi\xE7os especializados</p>\n        </div>\n        <div>\n          <dt class="sr-only">Tipos de ve\xEDculos</dt>\n          <dd class="text-h2 font-extrabold text-white tabular-nums">{{ vehicles.length }}</dd>\n          <p class="mt-1 text-meta font-medium text-bone-400">Tipos de ve\xEDculo</p>\n        </div>\n        <div>\n          <dt class="sr-only">Abordagem</dt>\n          <dd class="text-h2 font-extrabold text-white">100%</dd>\n          <p class="mt-1 text-meta font-medium text-bone-400">Multimarca</p>\n        </div>\n      </dl>\n    </div>\n  </div>\n</section>\n\n<!-- ========================================================== Promessa === -->\n<app-page-section tone="bone">\n  <app-section-heading\n    eyebrow="Porque nos escolhem"\n    title="A sua satisfa\xE7\xE3o \xE9 a nossa maior prioridade"\n    lead="Tr\xEAs compromissos que assumimos em cada viatura que entra na nossa oficina."\n    appReveal\n  />\n\n  <div class="mt-14 grid gap-6 md:grid-cols-3">\n    @for (value of values; track value.title) {\n      <app-feature-card [feature]="value" [index]="$index + 1" appReveal [revealDelay]="$index * 90" />\n    }\n  </div>\n</app-page-section>\n\n<!-- =========================================================== Servi\xE7os === -->\n<app-page-section tone="white">\n  <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">\n    <app-section-heading\n      align="left"\n      eyebrow="O que fazemos"\n      title="Da manuten\xE7\xE3o corrente \xE0 repara\xE7\xE3o complexa"\n      lead="Uma oficina multimarca completa, com equipamento de diagn\xF3stico e t\xE9cnicos especializados."\n      appReveal\n    />\n    <app-button routerLink="/servicos" variant="dark" icon="arrow-right" class="shrink-0"\n      >Todos os servi\xE7os</app-button\n    >\n  </div>\n\n  <ul class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">\n    @for (service of featuredServices; track service.id) {\n      <li appReveal [revealDelay]="$index * 60">\n        <a\n          routerLink="/servicos"\n          [fragment]="service.id"\n          class="group flex h-full flex-col rounded-2xl bg-bone-100 p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-ink-950 hover:shadow-card-hover"\n        >\n          <span\n            class="grid size-12 place-items-center rounded-xl bg-white text-brand-600 shadow-sm transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white"\n          >\n            <app-icon [name]="service.icon" [size]="24" />\n          </span>\n          <h3\n            class="mt-6 text-h3 font-bold text-ink-950 transition-colors duration-300 group-hover:text-white"\n          >\n            {{ service.title }}\n          </h3>\n          <p\n            class="mt-2.5 flex-1 text-body text-ink-600 transition-colors duration-300 group-hover:text-bone-300"\n          >\n            {{ service.description }}\n          </p>\n          <span\n            class="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors duration-300 group-hover:text-brand-400"\n          >\n            Saber mais\n            <app-icon\n              name="arrow-right"\n              [size]="16"\n              class="transition-transform duration-200 group-hover:translate-x-1"\n            />\n          </span>\n        </a>\n      </li>\n    }\n  </ul>\n</app-page-section>\n\n<!-- =========================================================== Ve\xEDculos === -->\n<app-page-section tone="bone">\n  <app-section-heading\n    eyebrow="Sem exclusividades"\n    title="Que ve\xEDculos recebemos"\n    lead="Do utilit\xE1rio do dia a dia ao cl\xE1ssico de estima\xE7\xE3o \u2014 trabalhamos com todas as marcas."\n    appReveal\n  />\n\n  <ul class="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">\n    @for (vehicle of vehicles; track vehicle.id) {\n      <li appReveal [revealDelay]="$index * 60">\n        <app-vehicle-card [vehicle]="vehicle" />\n      </li>\n    }\n  </ul>\n</app-page-section>\n\n<!-- ============================================================ Oficina === -->\n<app-page-section tone="white">\n  <div class="grid gap-12 lg:grid-cols-12 lg:gap-16">\n    <div class="lg:col-span-5">\n      <app-section-heading\n        align="left"\n        eyebrow="A oficina"\n        title="Equipamento a s\xE9rio, num espa\xE7o pensado para si"\n        lead="Investimos continuamente em tecnologia e nas melhores pr\xE1ticas do setor. Enquanto cuidamos do seu ve\xEDculo, tem parque pr\xF3prio e uma sala de espera confort\xE1vel \xE0 sua disposi\xE7\xE3o."\n        appReveal\n      />\n\n      <div class="mt-9 rounded-2xl bg-bone-100 p-6">\n        <h3 class="flex items-center gap-2 text-sm font-bold tracking-tight text-ink-950">\n          <app-icon name="clock" [size]="18" class="text-brand-600" />\n          Hor\xE1rio de funcionamento\n        </h3>\n        <app-opening-hours class="mt-2" />\n      </div>\n\n      <app-button routerLink="/sobre-nos" variant="dark" icon="arrow-right" class="mt-8"\n        >Conhecer a FS Automotive</app-button\n      >\n    </div>\n\n    <div class="lg:col-span-7" appReveal>\n      <app-gallery-grid [images]="gallery" [columns]="2" />\n    </div>\n  </div>\n</app-page-section>\n\n<!-- ================================================================ CTA === -->\n<app-page-section tone="bone" spacing="sm">\n  <app-cta-band />\n</app-page-section>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Home, { className: "Home", filePath: "src/app/features/home/home.ts", lineNumber: 47 });
})();
export {
  Home
};
//# sourceMappingURL=chunk-YTKXLBY3.js.map
