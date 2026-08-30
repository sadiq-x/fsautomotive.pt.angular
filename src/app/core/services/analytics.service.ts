import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, DestroyRef, Injectable, PLATFORM_ID, effect, inject } from '@angular/core';
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
 * Google Analytics 4, cookieless until the visitor says otherwise.
 *
 * Consent Mode v2 defaults are pushed **before** gtag.js loads. Which defaults
 * depends on what the visitor has already decided, and the three states are
 * genuinely different:
 *
 *  - **Undecided** — every category denied. GA4 measures without cookies while
 *    the notice is on screen, which needs no prior consent.
 *  - **Accepted** — `analytics_storage` granted, advertising still denied.
 *  - **Refused** — nothing at all: no script, no request, no listener.
 *
 * WHY ACCEPTANCE HAS TO GRANT `analytics_storage`
 * -----------------------------------------------
 * Running permanently denied looks like the more private choice, and it is —
 * but GA4 then reports nothing whatsoever. A denied hit is a *cookieless ping*:
 * it carries no client id and no session id, so it appears in no Realtime
 * report, no DebugView, and no standard report. Google keeps such pings only as
 * input to behavioural modelling, which switches on at roughly 1,000 denied
 * events/day **and** 1,000 granted users/day — thresholds a local workshop site
 * never reaches, and the second of which is unreachable by definition if
 * consent is never granted to anyone.
 *
 * So a permanently-denied GA4 is not a private analytics setup, it is an absent
 * one: the requests leave the browser, reach Google, and are discarded for
 * reporting. Granting `analytics_storage` on acceptance is what makes the
 * measurement real for visitors who agreed to it.
 *
 * The advertising categories stay denied in every state — the site runs no ads,
 * and reporting does not depend on them.
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
   * Whether gtag has been told `analytics_storage` is granted.
   *
   * Tracked so the grant is sent exactly once: {@link loadGtag} may already
   * have carried it in the consent *default* for a returning visitor, and
   * re-sending it as an update would be noise.
   */
  private analyticsStorageGranted = false;

  /**
   * `false` unless a well-formed Measurement ID was configured, the kill switch
   * allows it, and the app is running in a browser.
   */
  readonly enabled: boolean = this.config.enabled && this.isBrowser;

  constructor() {
    // Acceptance has to reach gtag *during this visit*, not on the next load:
    // the visitor clicked the button and expects to be measured from then on,
    // and until the update is sent every hit is still an unreportable
    // cookieless ping. `started` is already true here — `initialize()` runs
    // from the app shell's constructor, long before the notice can be clicked.
    effect(() => {
      if (this.consent.value() === 'accepted' && this.started) {
        this.grantAnalyticsStorage();
      }
    });
  }

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
   * Grants `analytics_storage`, the one category GA4 needs to attach a client
   * id to a visit — and therefore the one that decides whether the visit is
   * reported at all. See the class comment for why denied traffic is invisible.
   *
   * Idempotent, and never called for a visitor who has not accepted.
   */
  private grantAnalyticsStorage(): void {
    if (this.analyticsStorageGranted) {
      return;
    }

    this.analyticsStorageGranted = true;
    this.send('consent', 'update', { analytics_storage: 'granted' });
  }

  /**
   * Grants or revokes *every* storage category, advertising included.
   *
   * Not called anywhere today, and deliberately not wired to the privacy
   * notice: accepting that notice grants analytics measurement only. This is
   * the hook an advertising consent banner would use, and granting here turns
   * on personalisation the site has never asked anyone about.
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

    // A visitor who accepted on an earlier visit is measured from the very
    // first hit. Carrying that in the *default* rather than a later update
    // matters: the initial `page_view` fires as soon as the router settles, and
    // an update racing behind it would leave the session's first — and for a
    // one-page visit, only — hit unreportable.
    const analyticsStorage = this.consent.value() === 'accepted' ? 'granted' : 'denied';
    this.analyticsStorageGranted = analyticsStorage === 'granted';

    // This has to be pushed before the library loads — consent queued after
    // `config` would let GA4 start on its permissive defaults and set a cookie
    // before the denial is seen.
    view.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: analyticsStorage,
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
