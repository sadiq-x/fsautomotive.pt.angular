import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, type ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs';

import { ANALYTICS_CONFIG } from '../config/analytics.config';
import type {
  ContactClickParams,
  EventParamsFor,
  GaEventName,
  PageMeta,
  UserPropertyValue,
} from '../models';
import { ConsentService } from './consent.service';
import { SeoService } from './seo.service';

/** Identifies the injected `<script>` so it is never added twice. */
const GTAG_SCRIPT_ID = 'ga4-gtag';

/** Visible link text is a label, not a payload — GA4 truncates far above this. */
const MAX_LINK_TEXT = 100;

/**
 * Which contact event a given `href` belongs to, in match order.
 *
 * Phone and e-mail are the ones that matter most: GA4's enhanced measurement
 * instruments outbound *http* links only, so it never sees a `tel:` or
 * `mailto:` click. Directions overlaps with the generic outbound `click` event
 * GA4 may record on its own; this one is kept because a named conversion is
 * worth more in a report than a URL that has to be recognised by eye.
 */
const CONTACT_LINKS: readonly { readonly selector: string; readonly event: GaEventName }[] = [
  { selector: 'a[href^="tel:"]', event: 'phone_click' },
  { selector: 'a[href^="mailto:"]', event: 'email_click' },
  { selector: 'a[href*="maps.app.goo.gl"], a[href*="google.com/maps"]', event: 'directions_click' },
];

/**
 * Google Analytics 4, running cookieless.
 *
 * Consent Mode v2 defaults are pushed **before** gtag.js loads, with every
 * storage category denied. GA4 then measures without writing cookies or any
 * other client identifier, which is why measurement can begin without prior
 * consent. `CookieNotice` informs the visitor of that and offers an opt-out,
 * held by `ConsentService`; refusing stops measurement without ever having
 * involved a cookie. If personalised advertising or returning-visitor identity
 * is ever wanted, those categories must be granted through {@link setConsent} —
 * and *that* would require consent gathered up front.
 *
 * Nothing happens at all while no Measurement ID is configured: no script, no
 * request, no listener. See `core/config/analytics.config.ts`.
 *
 * Every public method is a no-op when analytics is disabled, so call sites need
 * no guard of their own, and none of them can throw.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  private readonly consent = inject(ConsentService);
  private readonly config = inject(ANALYTICS_CONFIG);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private started = false;

  /**
   * `false` unless a well-formed Measurement ID was configured, the kill switch
   * allows it, and the app is running in a browser.
   */
  readonly enabled: boolean = this.config.enabled && this.isBrowser;

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
  initialize(): void {
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
  trackEvent<T extends GaEventName>(name: T, params: EventParamsFor<T>): void {
    this.send('event', name, params);
  }

  /**
   * Reports a page view. Called automatically on every navigation; public so a
   * virtual view (a modal treated as a page, say) can be reported too.
   *
   * @param path Path only — strip query strings before calling.
   * @param title Falls back to the current document title.
   */
  trackPageView(path: string, title?: string): void {
    this.trackEvent('page_view', {
      page_path: path,
      page_location: this.document.defaultView?.location.href,
      page_title: title ?? this.document.title,
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
  setConsent(granted: boolean): void {
    const value = granted ? 'granted' : 'denied';
    this.send('consent', 'update', {
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
      analytics_storage: value,
    });
  }

  /**
   * Attaches user properties to every subsequent event.
   * Values must be primitives — gtag drops objects and arrays.
   */
  setUserProperties(props: Record<string, UserPropertyValue>): void {
    this.send('set', 'user_properties', props);
  }

  /**
   * Sets or clears the GA4 User-ID.
   *
   * Unused today — the site has no accounts, and with `analytics_storage`
   * denied there is no identifier to join sessions on anyway. It exists so that
   * adding a customer area later does not mean reopening this file.
   */
  setUserId(id: string | null): void {
    this.send('config', this.config.measurementId, { user_id: id ?? undefined });
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
  private send(command: string, target: string, params?: unknown): void {
    if (!this.enabled || !this.consent.analyticsAllowed()) {
      return;
    }

    if (this.config.debug) {
      console.debug('[analytics]', command, target, params);
    }

    this.document.defaultView?.gtag?.(command, target, params);
  }

  private loadGtag(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    view.dataLayer ??= [];
    // The real gtag shim: it queues onto dataLayer, so calls made before
    // gtag.js finishes downloading are replayed once it arrives.
    //
    // `arguments` and not a rest parameter, deliberately. gtag.js treats a
    // dataLayer entry as a command only when it is an `arguments` object; a
    // plain array is skipped without a warning. A rest parameter produces a
    // real array, so every command — `consent`, `config`, every event — was
    // queued and then silently dropped, and nothing was ever sent.
    // This is also why the snippet Google documents uses `function` rather
    // than an arrow: an arrow has no `arguments` of its own.
    view.gtag ??= function gtag() {
      view.dataLayer?.push(arguments);
    };

    // Cookieless posture. This has to be pushed before the library loads —
    // consent queued after `config` would let GA4 start on its permissive
    // defaults and set a cookie before the denial is seen.
    view.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
    });

    view.gtag('js', new Date());
    view.gtag('config', this.config.measurementId, {
      send_page_view: this.config.sendPageView,
      // Makes events show up in GA4's DebugView while developing, so the wiring
      // can be confirmed in seconds instead of waiting on reports. Stripped
      // from production builds, where `isDevMode()` is false.
      ...(this.config.debug ? { debug_mode: true } : {}),
    });

    if (this.document.getElementById(GTAG_SCRIPT_ID)) {
      return;
    }

    const script = this.document.createElement('script');
    script.id = GTAG_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.config.measurementId)}`;
    this.document.head.appendChild(script);
  }

  private trackPageViews(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
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
  private activeTitle(): string | undefined {
    let route: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const meta = route.data['meta'] as PageMeta | undefined;
    return meta ? this.seo.documentTitle(meta) : undefined;
  }

  /**
   * One delegated listener rather than a handler on each link — the phone
   * number alone is rendered in the header, hero, footer, contact cards, the
   * CTA band and the 404 page, and any future one is covered automatically.
   *
   * Capture phase, because a `tel:` click navigates away: on a real device the
   * bubble phase can be cut short by the dialer taking over.
   */
  private trackContactClicks(): void {
    const onClick = (event: Event) => {
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

    this.document.addEventListener('click', onClick, { capture: true });
    this.destroyRef.onDestroy(() =>
      this.document.removeEventListener('click', onClick, { capture: true }),
    );
  }

  private contactParams(link: Element): ContactClickParams {
    return {
      link_url: link.getAttribute('href') ?? '',
      link_text: link.textContent?.trim().slice(0, MAX_LINK_TEXT) || undefined,
      placement: link.closest('header, footer, nav')?.tagName.toLowerCase() ?? 'main',
      page_path: stripQuery(this.router.url),
    };
  }
}

/**
 * Drops the query string and fragment from a URL path.
 *
 * `page_path` is what groups the "Pages" report, and an ad or social link
 * arriving with `?fbclid=…` would otherwise split one page across hundreds of
 * rows. It also keeps anything a third party appended out of the report, which
 * is the cheapest defence against a stray identifier in a query parameter.
 *
 * `page_location` keeps the full URL on purpose — GA4 reads `utm_*` campaign
 * tags from it, and stripping them there would break attribution.
 */
function stripQuery(url: string): string {
  return url.split(/[?#]/)[0] || '/';
}
