import {
  CtaBand,
  FeatureCard,
  GalleryGrid,
  PageHero,
  PageSection,
  RevealDirective,
  SectionHeading
} from "./chunk-A7H3SNWI.js";
import {
  OpeningHours
} from "./chunk-AL2QOPM3.js";
import {
  UiButton
} from "./chunk-NGHYTC22.js";
import {
  ABOUT_STORY,
  AMENITIES,
  WORKSHOP_GALLERY
} from "./chunk-H4LGSLFV.js";
import {
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
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-RUFDRP5X.js";

// src/app/features/about/about.ts
var _forTrack0 = ($index, $item) => $item.title;
function About_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-feature-card", 4);
  }
  if (rf & 2) {
    const item_r1 = ctx.$implicit;
    const $index_r2 = ctx.$index;
    \u0275\u0275property("feature", item_r1)("index", $index_r2 + 1)("revealDelay", $index_r2 * 80);
  }
}
function About_For_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 10)(1, "span", 21);
    \u0275\u0275element(2, "app-icon", 22);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span")(4, "span", 23);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "span", 24);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const amenity_r3 = ctx.$implicit;
    const $index_r4 = ctx.$index;
    \u0275\u0275property("revealDelay", $index_r4 * 80);
    \u0275\u0275advance(2);
    \u0275\u0275property("name", amenity_r3.icon)("size", 22);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(amenity_r3.title);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(amenity_r3.description);
  }
}
var About = class _About {
  site = SITE;
  story = ABOUT_STORY;
  amenities = AMENITIES;
  gallery = WORKSHOP_GALLERY;
  static \u0275fac = function About_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _About)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _About, selectors: [["app-about"]], decls: 28, vars: 5, consts: [["eyebrow", "Sobre n\xF3s", "title", "Uma oficina que trata a sua viatura como trataria a pr\xF3pria", 3, "lead"], ["tone", "bone"], ["eyebrow", "Quem somos", "title", "O que nos move", "lead", "Quatro princ\xEDpios que est\xE3o por tr\xE1s de cada interven\xE7\xE3o que fazemos.", "appReveal", ""], [1, "mt-14", "grid", "gap-6", "sm:grid-cols-2"], ["appReveal", "", 3, "feature", "index", "revealDelay"], ["tone", "white"], [1, "grid", "gap-12", "lg:grid-cols-12", "lg:gap-16"], [1, "lg:col-span-5"], ["align", "left", "eyebrow", "Comodidades para clientes", "title", "Enquanto espera, fica bem entregue", "lead", "A ida \xE0 oficina n\xE3o tem de ser um transtorno. Prepar\xE1mos o espa\xE7o para que possa esperar em conforto \u2014 ou deixar a viatura e seguir o seu dia.", "appReveal", ""], [1, "mt-9", "space-y-4"], ["appReveal", "", 1, "flex", "items-start", "gap-4", "rounded-2xl", "bg-bone-100", "p-6", 3, "revealDelay"], ["appReveal", "", 1, "lg:col-span-7"], [3, "images", "columns"], [1, "mt-4", "text-center", "text-xs", "text-ink-400"], ["tone", "bone", "sectionId", "horario"], [1, "mx-auto", "grid", "max-w-4xl", "gap-10", "rounded-3xl", "bg-white", "p-8", "shadow-card", "sm:p-12", "lg:grid-cols-2", "lg:gap-16"], ["align", "left", "eyebrow", "Hor\xE1rio de funcionamento", "title", "Quando pode contar connosco"], [1, "mt-6", "text-body", "text-ink-600"], ["variant", "primary", "icon", "phone", "iconPosition", "left", 1, "mt-8", 3, "href"], [1, "self-center"], ["tone", "bone", "spacing", "sm"], [1, "grid", "size-12", "shrink-0", "place-items-center", "rounded-xl", "bg-white", "text-brand-600", "shadow-sm"], [3, "name", "size"], [1, "block", "text-h3", "font-bold", "text-ink-950"], [1, "mt-1.5", "block", "text-body", "text-ink-600"]], template: function About_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275element(0, "app-page-hero", 0);
      \u0275\u0275elementStart(1, "app-page-section", 1);
      \u0275\u0275element(2, "app-section-heading", 2);
      \u0275\u0275elementStart(3, "div", 3);
      \u0275\u0275repeaterCreate(4, About_For_5_Template, 1, 3, "app-feature-card", 4, _forTrack0);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(6, "app-page-section", 5)(7, "div", 6)(8, "div", 7);
      \u0275\u0275element(9, "app-section-heading", 8);
      \u0275\u0275elementStart(10, "ul", 9);
      \u0275\u0275repeaterCreate(11, About_For_12_Template, 8, 5, "li", 10, _forTrack0);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(13, "div", 11);
      \u0275\u0275element(14, "app-gallery-grid", 12);
      \u0275\u0275elementStart(15, "p", 13);
      \u0275\u0275text(16, "Toque numa fotografia para ampliar.");
      \u0275\u0275elementEnd()()()();
      \u0275\u0275elementStart(17, "app-page-section", 14)(18, "div", 15)(19, "div");
      \u0275\u0275element(20, "app-section-heading", 16);
      \u0275\u0275elementStart(21, "p", 17);
      \u0275\u0275text(22, " Estamos abertos de segunda a sexta-feira. Se precisar de deixar a viatura fora deste hor\xE1rio, ligue-nos e encontramos uma solu\xE7\xE3o. ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(23, "app-button", 18);
      \u0275\u0275text(24);
      \u0275\u0275elementEnd()();
      \u0275\u0275element(25, "app-opening-hours", 19);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(26, "app-page-section", 20);
      \u0275\u0275element(27, "app-cta-band");
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275property("lead", "A " + ctx.site.name + " \xE9 uma oficina especializada em servi\xE7os autom\xF3veis de alta qualidade, com uma equipa dedicada e experiente, liderada por " + ctx.site.owner + ".");
      \u0275\u0275advance(4);
      \u0275\u0275repeater(ctx.story);
      \u0275\u0275advance(7);
      \u0275\u0275repeater(ctx.amenities);
      \u0275\u0275advance(3);
      \u0275\u0275property("images", ctx.gallery)("columns", 2);
      \u0275\u0275advance(9);
      \u0275\u0275property("href", ctx.site.phone.href);
      \u0275\u0275advance();
      \u0275\u0275textInterpolate(ctx.site.phone.display);
    }
  }, dependencies: [
    CtaBand,
    FeatureCard,
    GalleryGrid,
    Icon,
    OpeningHours,
    PageHero,
    PageSection,
    RevealDirective,
    SectionHeading,
    UiButton
  ], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(About, [{
    type: Component,
    args: [{ selector: "app-about", changeDetection: ChangeDetectionStrategy.OnPush, imports: [
      CtaBand,
      FeatureCard,
      GalleryGrid,
      Icon,
      OpeningHours,
      PageHero,
      PageSection,
      RevealDirective,
      SectionHeading,
      UiButton
    ], template: `<app-page-hero
  eyebrow="Sobre n\xF3s"
  title="Uma oficina que trata a sua viatura como trataria a pr\xF3pria"
  [lead]="
    'A ' +
    site.name +
    ' \xE9 uma oficina especializada em servi\xE7os autom\xF3veis de alta qualidade, com uma equipa dedicada e experiente, liderada por ' +
    site.owner +
    '.'
  "
/>

<!-- ============================================================ Hist\xF3ria === -->
<app-page-section tone="bone">
  <app-section-heading
    eyebrow="Quem somos"
    title="O que nos move"
    lead="Quatro princ\xEDpios que est\xE3o por tr\xE1s de cada interven\xE7\xE3o que fazemos."
    appReveal
  />

  <div class="mt-14 grid gap-6 sm:grid-cols-2">
    @for (item of story; track item.title) {
      <app-feature-card [feature]="item" [index]="$index + 1" appReveal [revealDelay]="$index * 80" />
    }
  </div>
</app-page-section>

<!-- ======================================================== Comodidades === -->
<app-page-section tone="white">
  <div class="grid gap-12 lg:grid-cols-12 lg:gap-16">
    <div class="lg:col-span-5">
      <app-section-heading
        align="left"
        eyebrow="Comodidades para clientes"
        title="Enquanto espera, fica bem entregue"
        lead="A ida \xE0 oficina n\xE3o tem de ser um transtorno. Prepar\xE1mos o espa\xE7o para que possa esperar em conforto \u2014 ou deixar a viatura e seguir o seu dia."
        appReveal
      />

      <ul class="mt-9 space-y-4">
        @for (amenity of amenities; track amenity.title) {
          <li
            class="flex items-start gap-4 rounded-2xl bg-bone-100 p-6"
            appReveal
            [revealDelay]="$index * 80"
          >
            <span
              class="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"
            >
              <app-icon [name]="amenity.icon" [size]="22" />
            </span>
            <span>
              <span class="block text-h3 font-bold text-ink-950">{{ amenity.title }}</span>
              <span class="mt-1.5 block text-body text-ink-600">{{ amenity.description }}</span>
            </span>
          </li>
        }
      </ul>
    </div>

    <div class="lg:col-span-7" appReveal>
      <app-gallery-grid [images]="gallery" [columns]="2" />
      <p class="mt-4 text-center text-xs text-ink-400">Toque numa fotografia para ampliar.</p>
    </div>
  </div>
</app-page-section>

<!-- ============================================================= Hor\xE1rio === -->
<app-page-section tone="bone" sectionId="horario">
  <div
    class="mx-auto grid max-w-4xl gap-10 rounded-3xl bg-white p-8 shadow-card sm:p-12 lg:grid-cols-2 lg:gap-16"
  >
    <div>
      <app-section-heading
        align="left"
        eyebrow="Hor\xE1rio de funcionamento"
        title="Quando pode contar connosco"
      />
      <p class="mt-6 text-body text-ink-600">
        Estamos abertos de segunda a sexta-feira. Se precisar de deixar a viatura fora deste hor\xE1rio,
        ligue-nos e encontramos uma solu\xE7\xE3o.
      </p>
      <app-button [href]="site.phone.href" variant="primary" icon="phone" iconPosition="left" class="mt-8">{{
        site.phone.display
      }}</app-button>
    </div>

    <app-opening-hours class="self-center" />
  </div>
</app-page-section>

<!-- ================================================================ CTA === -->
<app-page-section tone="bone" spacing="sm">
  <app-cta-band />
</app-page-section>
` }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(About, { className: "About", filePath: "src/app/features/about/about.ts", lineNumber: 35 });
})();
export {
  About
};
//# sourceMappingURL=chunk-BM5QIKB4.js.map
