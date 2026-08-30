import {
  ConsentService,
  OPENING_HOURS,
  SERVICES,
  SITE
} from "./chunk-UVBD33FH.js";
import {
  takeUntilDestroyed
} from "./chunk-TZW5CK7K.js";
import {
  DOCUMENT,
  DestroyRef,
  Injectable,
  InjectionToken,
  Meta,
  NavigationEnd,
  PLATFORM_ID,
  Router,
  Title,
  __spreadValues,
  filter,
  inject,
  isDevMode,
  isPlatformBrowser,
  setClassMetadata,
  ɵɵdefineInjectable
} from "./chunk-RUFDRP5X.js";

// src/app/core/config/analytics.config.ts
var GA_MEASUREMENT_ID = true ? "G-034WR9J2NH".trim() : "";
var GA_ENABLED_FLAG = true ? "".trim() : "";
function isMeasurementIdConfigured(id) {
  return /^G-[A-Z0-9]{4,}$/i.test(id);
}
function isEnabledByFlag(flag) {
  return !["false", "0", "off", "no"].includes(flag.toLowerCase());
}
function buildAnalyticsConfig(measurementId, enabledFlag, debug) {
  return {
    measurementId,
    enabled: isMeasurementIdConfigured(measurementId) && isEnabledByFlag(enabledFlag),
    debug,
    sendPageView: false
  };
}
var ANALYTICS_CONFIG = new InjectionToken("ANALYTICS_CONFIG", {
  providedIn: "root",
  factory: () => buildAnalyticsConfig(GA_MEASUREMENT_ID, GA_ENABLED_FLAG, isDevMode())
});

// src/app/core/services/seo.service.ts
var SeoService = class _SeoService {
  title = inject(Title);
  meta = inject(Meta);
  document = inject(DOCUMENT);
  /**
   * The exact string that ends up in `<title>`.
   *
   * Public because `AnalyticsService` needs the same value for `page_title`,
   * and it cannot read `document.title`: the title is applied from an `effect`,
   * which flushes *after* the router event analytics reacts to, so reading the
   * DOM there would report the previous page.
   */
  documentTitle(page) {
    return `${page.title} | ${SITE.name}`;
  }
  apply(page) {
    const fullTitle = this.documentTitle(page);
    const canonical = this.absoluteUrl(page.path);
    const image = this.absoluteUrl(page.image ?? SITE.squareLogo);
    this.title.setTitle(fullTitle);
    this.upsertName("description", page.description);
    this.applyRobots(page.noIndex === true);
    this.upsertName("twitter:card", "summary_large_image");
    this.upsertName("twitter:title", fullTitle);
    this.upsertName("twitter:description", page.description);
    this.upsertName("twitter:image", image);
    this.upsertProperty("og:type", "website");
    this.upsertProperty("og:site_name", SITE.name);
    this.upsertProperty("og:locale", "pt_PT");
    this.upsertProperty("og:title", fullTitle);
    this.upsertProperty("og:description", page.description);
    this.upsertProperty("og:url", canonical);
    this.upsertProperty("og:image", image);
    this.setCanonical(canonical);
  }
  /**
   * Adds or removes the `robots` directive.
   *
   * Removing it matters as much as adding it: the tag is set on one shared
   * document, so navigating from a private page back to a public one has to
   * take the `noindex` with it — otherwise the whole site becomes unindexable
   * after any visit to `/gestao`.
   */
  applyRobots(noIndex) {
    if (noIndex) {
      this.upsertName("robots", "noindex, nofollow");
      return;
    }
    this.meta.removeTag('name="robots"');
  }
  upsertName(name, content) {
    this.meta.updateTag({ name, content }, `name="${name}"`);
  }
  upsertProperty(property, content) {
    this.meta.updateTag({ property, content }, `property="${property}"`);
  }
  setCanonical(href) {
    const head = this.document.head;
    let link = head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement("link");
      link.setAttribute("rel", "canonical");
      head.appendChild(link);
    }
    link.setAttribute("href", href);
  }
  absoluteUrl(pathOrUrl) {
    if (/^https?:\/\//.test(pathOrUrl)) {
      return pathOrUrl;
    }
    return new URL(pathOrUrl.replace(/^\//, ""), `${SITE.url}/`).toString();
  }
  static \u0275fac = function SeoService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SeoService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _SeoService, factory: _SeoService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SeoService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();

// src/app/core/services/analytics.service.ts
var GTAG_SCRIPT_ID = "ga4-gtag";
var MAX_LINK_TEXT = 100;
var CONTACT_LINKS = [
  { selector: 'a[href^="tel:"]', event: "phone_click" },
  { selector: 'a[href^="mailto:"]', event: "email_click" },
  { selector: 'a[href*="maps.app.goo.gl"], a[href*="google.com/maps"]', event: "directions_click" }
];
var AnalyticsService = class _AnalyticsService {
  document = inject(DOCUMENT);
  router = inject(Router);
  destroyRef = inject(DestroyRef);
  seo = inject(SeoService);
  consent = inject(ConsentService);
  config = inject(ANALYTICS_CONFIG);
  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  started = false;
  /**
   * `false` unless a well-formed Measurement ID was configured, the kill switch
   * allows it, and the app is running in a browser.
   */
  enabled = this.config.enabled && this.isBrowser;
  /**
   * Loads gtag.js and starts tracking. Called once by the app shell — the same
   * place `StructuredDataService` is wired up. Safe to call again; it will not
   * re-run.
   *
   * A visitor who has previously refused gets nothing: no script, no listener.
   * One who refuses *during* a visit keeps the listeners, but every event is
   * dropped by {@link send} from that moment on. Re-enabling after a refusal
   * takes effect on the next page load.
   */
  initialize() {
    if (!this.enabled || this.started || !this.consent.analyticsAllowed()) {
      return;
    }
    this.started = true;
    this.loadGtag();
    this.trackPageViews();
    this.trackContactClicks();
  }
  /**
   * Sends a GA4 event. The name must be one of {@link GaEventName} and its
   * parameters are checked against that name, so a typo cannot silently create
   * an empty event in the reports.
   */
  trackEvent(name, params) {
    this.send("event", name, params);
  }
  /**
   * Reports a page view. Called automatically on every navigation; public so a
   * virtual view (a modal treated as a page, say) can be reported too.
   *
   * @param path Path only — strip query strings before calling.
   * @param title Falls back to the current document title.
   */
  trackPageView(path, title) {
    this.trackEvent("page_view", {
      page_path: path,
      page_location: this.document.defaultView?.location.href,
      page_title: title ?? this.document.title
    });
  }
  /**
   * Grants or revokes the storage categories GA4 uses for identity.
   *
   * Not called anywhere today, and deliberately not wired to the privacy
   * notice: that notice offers an opt-out, not a storage grant, so accepting it
   * changes nothing about cookies. This is the hook a *consent* banner would
   * use — granting turns GA4's cookies back on, which is a different decision
   * needing consent gathered before any measurement happens.
   */
  setConsent(granted) {
    const value = granted ? "granted" : "denied";
    this.send("consent", "update", {
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
      analytics_storage: value
    });
  }
  /**
   * Attaches user properties to every subsequent event.
   * Values must be primitives — gtag drops objects and arrays.
   */
  setUserProperties(props) {
    this.send("set", "user_properties", props);
  }
  /**
   * Sets or clears the GA4 User-ID.
   *
   * Unused today — the site has no accounts, and with `analytics_storage`
   * denied there is no identifier to join sessions on anyway. It exists so that
   * adding a customer area later does not mean reopening this file.
   */
  setUserId(id) {
    this.send("config", this.config.measurementId, { user_id: id ?? void 0 });
  }
  /**
   * The single exit point to gtag.
   *
   * Everything funnels through here so the disabled check, the consent check,
   * the "not loaded yet" check and the debug logging exist exactly once.
   * `gtag` is the shim installed by {@link loadGtag}, which queues onto
   * `dataLayer`; calls made before the library finishes downloading are
   * replayed when it arrives, so no separate queue of our own is needed.
   *
   * Consent is read on every call, not cached at startup: refusing must stop
   * measurement in the same tab, without a reload.
   */
  send(command, target, params) {
    if (!this.enabled || !this.consent.analyticsAllowed()) {
      return;
    }
    if (this.config.debug) {
      console.debug("[analytics]", command, target, params);
    }
    this.document.defaultView?.gtag?.(command, target, params);
  }
  loadGtag() {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }
    view.dataLayer ??= [];
    view.gtag ??= function gtag() {
      view.dataLayer?.push(arguments);
    };
    view.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "denied",
      personalization_storage: "denied",
      security_storage: "granted"
    });
    view.gtag("js", /* @__PURE__ */ new Date());
    view.gtag("config", this.config.measurementId, __spreadValues({
      send_page_view: this.config.sendPageView
    }, this.config.debug ? { debug_mode: true } : {}));
    if (this.document.getElementById(GTAG_SCRIPT_ID)) {
      return;
    }
    const script = this.document.createElement("script");
    script.id = GTAG_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.config.measurementId)}`;
    this.document.head.appendChild(script);
  }
  trackPageViews() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.trackPageView(stripQuery(event.urlAfterRedirects), this.activeTitle());
    });
  }
  /**
   * The title of the page just navigated to, taken from the route's `data.meta`
   * — the same source `SeoService` uses.
   *
   * Reading `document.title` here would be wrong: it is set from an `effect` in
   * the app shell, which flushes after this handler runs, so every page view
   * would carry the *previous* page's title.
   */
  activeTitle() {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const meta = route.data["meta"];
    return meta ? this.seo.documentTitle(meta) : void 0;
  }
  /**
   * One delegated listener rather than a handler on each link — the phone
   * number alone is rendered in the header, hero, footer, contact cards, the
   * CTA band and the 404 page, and any future one is covered automatically.
   *
   * Capture phase, because a `tel:` click navigates away: on a real device the
   * bubble phase can be cut short by the dialer taking over.
   */
  trackContactClicks() {
    const onClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      for (const { selector, event: name } of CONTACT_LINKS) {
        const link = target.closest(selector);
        if (link) {
          this.trackEvent(name, this.contactParams(link));
          return;
        }
      }
    };
    this.document.addEventListener("click", onClick, { capture: true });
    this.destroyRef.onDestroy(() => this.document.removeEventListener("click", onClick, { capture: true }));
  }
  contactParams(link) {
    return {
      link_url: link.getAttribute("href") ?? "",
      link_text: link.textContent?.trim().slice(0, MAX_LINK_TEXT) || void 0,
      placement: link.closest("header, footer, nav")?.tagName.toLowerCase() ?? "main",
      page_path: stripQuery(this.router.url)
    };
  }
  static \u0275fac = function AnalyticsService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AnalyticsService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AnalyticsService, factory: _AnalyticsService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AnalyticsService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();
function stripQuery(url) {
  return url.split(/[?#]/)[0] || "/";
}

// src/app/core/services/structured-data.service.ts
var SCRIPT_ID = "ld-json-local-business";
var StructuredDataService = class _StructuredDataService {
  document = inject(DOCUMENT);
  publishLocalBusiness() {
    const payload = {
      "@context": "https://schema.org",
      "@type": "AutoRepair",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      legalName: SITE.legalName,
      description: SITE.description,
      url: SITE.url,
      logo: `${SITE.url}/${SITE.squareLogo}`,
      image: `${SITE.url}/${SITE.logo}`,
      telephone: SITE.phone.e164,
      email: SITE.email,
      founder: { "@type": "Person", name: SITE.owner },
      foundingDate: String(SITE.foundedYear),
      priceRange: "\u20AC\u20AC",
      currenciesAccepted: "EUR",
      areaServed: [
        { "@type": "City", name: "Vialonga" },
        { "@type": "City", name: "Alverca do Ribatejo" },
        { "@type": "City", name: "Vila Franca de Xira" },
        { "@type": "City", name: "Loures" },
        { "@type": "AdministrativeArea", name: "Lisboa" }
      ],
      address: {
        "@type": "PostalAddress",
        streetAddress: SITE.address.street,
        postalCode: SITE.address.postalCode,
        addressLocality: SITE.address.city,
        addressCountry: SITE.address.countryCode
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: SITE.address.latitude,
        longitude: SITE.address.longitude
      },
      hasMap: SITE.address.directionsUrl,
      sameAs: SITE.socials.filter((s) => s.href.startsWith("http")).map((s) => s.href),
      openingHoursSpecification: this.openingHoursSpecification(),
      makesOffer: SERVICES.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          description: service.description
        }
      }))
    };
    this.upsertScript(payload);
  }
  openingHoursSpecification() {
    return OPENING_HOURS.filter((entry) => !entry.closed).flatMap((entry) => (entry.schemaOpens ?? []).map((opens, index) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: entry.schemaDays.map((day) => `https://schema.org/${day}`),
      opens,
      closes: entry.schemaCloses?.[index]
    })));
  }
  upsertScript(payload) {
    const head = this.document.head;
    let script = head.querySelector(`script#${SCRIPT_ID}`);
    if (!script) {
      script = this.document.createElement("script");
      script.id = SCRIPT_ID;
      script.type = "application/ld+json";
      head.appendChild(script);
    }
    script.textContent = JSON.stringify(payload);
  }
  static \u0275fac = function StructuredDataService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _StructuredDataService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _StructuredDataService, factory: _StructuredDataService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(StructuredDataService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();

export {
  SeoService,
  AnalyticsService,
  StructuredDataService
};
//# sourceMappingURL=chunk-PWBEWDIV.js.map
