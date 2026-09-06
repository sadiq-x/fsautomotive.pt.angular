import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, type Routes } from '@angular/router';

import { Home } from '../../features/home/home';
import {
  ANALYTICS_CONFIG,
  GA_MEASUREMENT_ID,
  buildAnalyticsConfig,
  isEnabledByFlag,
  isMeasurementIdConfigured,
} from '../config/analytics.config';
import type { AnalyticsConfig, PageMeta } from '../models';
import { AnalyticsService } from './analytics.service';
import { ConsentService } from './consent.service';

const REAL_ID = 'G-TEST123456';

/** Routes carrying `data.meta`, the way the real ones do. */
const TEST_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: Home,
    data: { meta: { title: 'Início', description: '', path: '/' } satisfies PageMeta },
  },
  {
    path: 'servicos',
    component: Home,
    data: { meta: { title: 'Serviços', description: '', path: '/servicos' } satisfies PageMeta },
  },
  { path: 'legado', redirectTo: 'servicos', pathMatch: 'full' },

  // Mirrors the real private area: a route parameterised by a record
  // identifier. `gestaopublico` guards the prefix check against a bare
  // `startsWith`, which would sweep in an unrelated public route.
  {
    path: 'gestao/veiculos/:plate',
    component: Home,
    data: {
      meta: { title: 'Veículo', description: '', path: '/gestao/veiculos' } satisfies PageMeta,
    },
  },
  {
    path: 'gestaopublico',
    component: Home,
    data: {
      meta: { title: 'Público', description: '', path: '/gestaopublico' } satisfies PageMeta,
    },
  },
];

function setup(config: Partial<AnalyticsConfig> = {}): AnalyticsService {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(TEST_ROUTES),
      {
        provide: ANALYTICS_CONFIG,
        useValue: {
          measurementId: REAL_ID,
          enabled: true,
          debug: false,
          sendPageView: false,
          ...config,
        } satisfies AnalyticsConfig,
      },
    ],
  });
  return TestBed.inject(AnalyticsService);
}

/** Everything gtag pushed, flattened from the dataLayer queue. */
function pushed(): unknown[][] {
  return ((window.dataLayer ?? []) as unknown[][]).map((entry) =>
    Array.from(entry as ArrayLike<unknown>),
  );
}

function commandsNamed(command: string): unknown[][] {
  return pushed().filter((args) => args[0] === command);
}

function eventsNamed(name: string): Record<string, unknown>[] {
  return pushed()
    .filter((args) => args[0] === 'event' && args[1] === name)
    .map((args) => (args[2] ?? {}) as Record<string, unknown>);
}

/** Renders a link inside a region and clicks its inner text node. */
function clickLink(href: string, region: 'header' | 'footer' | 'main' = 'main'): void {
  const wrapper = document.createElement(region);
  wrapper.innerHTML = `<a href="${href}"><span>clique</span></a>`;
  document.body.appendChild(wrapper);
  (wrapper.querySelector('span') as HTMLElement).click();
  wrapper.remove();
}

describe('analytics config', () => {
  it('treats a missing .env value as unconfigured', () => {
    expect(isMeasurementIdConfigured('')).toBe(false);
  });

  // Tests run through `ng test`, which does not inject the define, so the
  // typeof guard in the config must resolve to '' rather than throwing.
  it('resolves to an empty string when the build injected nothing', () => {
    expect(GA_MEASUREMENT_ID).toBe('');
  });

  it('rejects a malformed id and accepts a real one', () => {
    expect(isMeasurementIdConfigured('UA-12345-1')).toBe(false);
    expect(isMeasurementIdConfigured('GTM-ABCD123')).toBe(false);
    expect(isMeasurementIdConfigured('G-')).toBe(false);
    expect(isMeasurementIdConfigured(REAL_ID)).toBe(true);
  });

  it('treats an unset kill switch as "follow the Measurement ID"', () => {
    expect(isEnabledByFlag('')).toBe(true);
    expect(isEnabledByFlag('true')).toBe(true);
  });

  it('honours every spelling of the kill switch', () => {
    for (const off of ['false', 'FALSE', '0', 'off', 'no']) {
      expect(isEnabledByFlag(off)).toBe(false);
    }
  });

  it('needs both a valid id and the switch on to enable anything', () => {
    expect(buildAnalyticsConfig(REAL_ID, '', false).enabled).toBe(true);
    expect(buildAnalyticsConfig(REAL_ID, 'false', false).enabled).toBe(false);
    expect(buildAnalyticsConfig('', '', false).enabled).toBe(false);
  });

  it('never lets gtag send its own page view', () => {
    expect(buildAnalyticsConfig(REAL_ID, '', false).sendPageView).toBe(false);
  });
});

describe('AnalyticsService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    delete window.dataLayer;
    delete window.gtag;
    document.getElementById('ga4-gtag')?.remove();
    localStorage.clear();
  });

  describe('while disabled', () => {
    it('reports itself disabled when no id is configured', () => {
      expect(setup({ measurementId: '', enabled: false }).enabled).toBe(false);
    });

    it('loads no script, contacts nothing and defines no globals', () => {
      setup({ enabled: false }).initialize();

      expect(document.getElementById('ga4-gtag')).toBeNull();
      expect(window.dataLayer).toBeUndefined();
      expect(window.gtag).toBeUndefined();
    });

    it('swallows every public call without throwing', () => {
      const analytics = setup({ enabled: false });
      analytics.initialize();

      expect(() => {
        analytics.trackEvent('phone_click', {
          link_url: 'tel:+351933678865',
          placement: 'main',
          page_path: '/',
        });
        analytics.trackPageView('/');
        analytics.setConsent(true);
        analytics.setUserProperties({ plan: 'none' });
        analytics.setUserId(null);
      }).not.toThrow();

      expect(window.dataLayer).toBeUndefined();
    });

    it('attaches no click listener, so clicks stay untracked', () => {
      setup({ enabled: false }).initialize();
      clickLink('tel:+351933678865');

      expect(window.dataLayer).toBeUndefined();
    });
  });

  describe('once a Measurement ID is set', () => {
    it('denies every storage category before loading gtag.js', () => {
      setup().initialize();

      const consent = pushed().find((args) => args[0] === 'consent' && args[1] === 'default');
      expect(consent?.[2]).toMatchObject({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      });

      // Consent must be queued ahead of the config call, or GA4 would start
      // with its permissive defaults and set a cookie before seeing the denial.
      const consentIndex = pushed().findIndex((args) => args[0] === 'consent');
      const configIndex = pushed().findIndex((args) => args[0] === 'config');
      expect(consentIndex).toBeLessThan(configIndex);
    });

    // Regression guard. Every other assertion here reads the queue through
    // `pushed()`, which normalises with `Array.from` and so cannot tell an
    // `arguments` object from an array — the whole suite passed while gtag.js
    // silently discarded every command and the site reported nothing.
    it('queues commands as `arguments`, the only shape gtag.js executes', () => {
      setup().initialize();

      for (const entry of window.dataLayer ?? []) {
        expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]');
        expect(Array.isArray(entry)).toBe(false);
      }
    });

    it('disables the automatic page view so SPA navigations are not missed', () => {
      setup().initialize();

      const config = pushed().find((args) => args[0] === 'config');
      expect(config?.[1]).toBe(REAL_ID);
      expect(config?.[2]).toMatchObject({ send_page_view: false });
    });

    it('turns on debug_mode only when configured to, so DebugView works', () => {
      setup({ debug: true }).initialize();
      expect(pushed().find((args) => args[0] === 'config')?.[2]).toMatchObject({
        debug_mode: true,
      });
    });

    it('leaves debug_mode out of a production build', () => {
      setup({ debug: false }).initialize();
      expect(pushed().find((args) => args[0] === 'config')?.[2]).not.toHaveProperty('debug_mode');
    });

    it('appends the gtag script exactly once', () => {
      const analytics = setup();
      analytics.initialize();
      analytics.initialize();

      const scripts = document.querySelectorAll('script[id="ga4-gtag"]');
      expect(scripts.length).toBe(1);
      expect(scripts[0].getAttribute('src')).toContain(`id=${REAL_ID}`);
    });

    it('sends a page view on navigation', async () => {
      setup().initialize();
      await TestBed.inject(Router).navigateByUrl('/');

      const views = eventsNamed('page_view');
      expect(views.length).toBe(1);
      expect(views[0]['page_path']).toBe('/');
    });

    // Regression: the title used to be read from `document.title`, which the
    // SEO effect only sets *after* this handler runs — so every page view
    // carried the previous page's title.
    it('titles the page view from the route it just navigated to', async () => {
      setup().initialize();
      const router = TestBed.inject(Router);

      await router.navigateByUrl('/');
      await router.navigateByUrl('/servicos');

      const views = eventsNamed('page_view');
      expect(views[0]['page_title']).toBe('Início | FS Automotive');
      expect(views[1]['page_title']).toBe('Serviços | FS Automotive');
    });

    it('follows a redirect to the path actually landed on', async () => {
      setup().initialize();
      await TestBed.inject(Router).navigateByUrl('/legado');

      expect(eventsNamed('page_view')[0]['page_path']).toBe('/servicos');
    });

    // An ad or social link arriving with ?fbclid=… would otherwise split one
    // page across hundreds of rows in the Pages report.
    it('keeps the query string out of page_path', async () => {
      setup().initialize();
      await TestBed.inject(Router).navigateByUrl('/servicos?fbclid=abc123#top');

      expect(eventsNamed('page_view')[0]['page_path']).toBe('/servicos');
    });

    // Regression: this used to issue a second `gtag('config', …)`. A repeated
    // config without `send_page_view` inherits GA4's default of `true`, so
    // identifying a user silently emitted a page view — the exact thing
    // `sendPageView: false` exists to prevent.
    it('identifies a user without emitting a page view', () => {
      const analytics = setup();
      analytics.initialize();
      const before = eventsNamed('page_view').length;

      analytics.setUserId('customer-42');

      expect(eventsNamed('page_view').length).toBe(before);
      expect(commandsNamed('config').length).toBe(1);
      expect(pushed().find((args) => args[0] === 'set' && args.length === 2)?.[1]).toMatchObject({
        user_id: 'customer-42',
      });
    });

    // `undefined` is dropped by gtag, so the old code could never clear an id.
    it('clears the User-ID with null rather than undefined', () => {
      const analytics = setup();
      analytics.initialize();
      analytics.setUserId(null);

      const set = pushed().filter((args) => args[0] === 'set' && args.length === 2);
      expect(set.at(-1)?.[1]).toEqual({ user_id: null });
    });

    it('grants and revokes consent through the banner hook', () => {
      const analytics = setup();
      analytics.initialize();

      analytics.setConsent(true);
      analytics.setConsent(false);

      const updates = commandsNamed('consent').filter((args) => args[1] === 'update');
      expect(updates[0]?.[2]).toMatchObject({ analytics_storage: 'granted' });
      expect(updates[1]?.[2]).toMatchObject({ analytics_storage: 'denied' });
    });
  });

  // The private area is parameterised by real records — plates, customer ids,
  // service-order ids. A plate identifies a vehicle and so its owner, which
  // makes a page view from `/gestao` the workshop's customers' personal data
  // leaving for Google. Nothing here is a reporting nicety; it is the boundary.
  describe('the private management area', () => {
    it('reports no page view for a route carrying a registration plate', async () => {
      setup().initialize();
      await TestBed.inject(Router).navigateByUrl('/gestao/veiculos/AA-00-BB');

      expect(eventsNamed('page_view').length).toBe(0);
      expect(JSON.stringify(pushed())).not.toContain('AA-00-BB');
    });

    it('keeps measuring the public site around it', async () => {
      setup().initialize();
      const router = TestBed.inject(Router);

      await router.navigateByUrl('/servicos');
      await router.navigateByUrl('/gestao/veiculos/AA-00-BB');
      await router.navigateByUrl('/');

      expect(eventsNamed('page_view').map((view) => view['page_path'])).toEqual(['/servicos', '/']);
    });

    it('reports no contact click made inside the private area', async () => {
      setup().initialize();
      await TestBed.inject(Router).navigateByUrl('/gestao/veiculos/AA-00-BB');
      clickLink('tel:+351933678865', 'header');

      expect(eventsNamed('phone_click').length).toBe(0);
    });

    // A bare `startsWith('/gestao')` would silently stop measuring this.
    it('does not mistake a public route that merely shares the prefix', async () => {
      setup().initialize();
      await TestBed.inject(Router).navigateByUrl('/gestaopublico');

      expect(eventsNamed('page_view')[0]?.['page_path']).toBe('/gestaopublico');
    });
  });

  describe('contact links', () => {
    it('reports a phone click wherever it is rendered', () => {
      setup().initialize();
      clickLink('tel:+351933678865', 'footer');

      const clicks = eventsNamed('phone_click');
      expect(clicks.length).toBe(1);
      expect(clicks[0]['link_url']).toBe('tel:+351933678865');
      expect(clicks[0]['placement']).toBe('footer');
      // The click landed on the inner span: the listener must walk up.
      expect(clicks[0]['link_text']).toBe('clique');
    });

    it('reports an e-mail click, which GA4 never sees on its own', () => {
      setup().initialize();
      clickLink('mailto:fsautomotive.servicos@gmail.com');

      expect(eventsNamed('email_click')[0]?.['link_url']).toBe(
        'mailto:fsautomotive.servicos@gmail.com',
      );
    });

    it('reports a directions click', () => {
      setup().initialize();
      clickLink('https://maps.app.goo.gl/popbTDGsMqgfEiqD6');

      expect(eventsNamed('directions_click').length).toBe(1);
    });

    it('ignores links that are not contact links', () => {
      setup().initialize();
      clickLink('https://www.facebook.com/people/FSautomotive/100057153442586/');

      expect(eventsNamed('phone_click').length).toBe(0);
      expect(eventsNamed('email_click').length).toBe(0);
      expect(eventsNamed('directions_click').length).toBe(0);
    });

    it('records which page the visitor converted from', async () => {
      setup().initialize();
      await TestBed.inject(Router).navigateByUrl('/servicos');
      clickLink('tel:+351933678865', 'header');

      expect(eventsNamed('phone_click')[0]['page_path']).toBe('/servicos');
    });
  });
  describe('when the visitor opts out', () => {
    it('loads nothing for someone who refused on an earlier visit', () => {
      const analytics = setup();
      TestBed.inject(ConsentService).decline();
      analytics.initialize();

      expect(document.getElementById('ga4-gtag')).toBeNull();
      expect(window.dataLayer).toBeUndefined();
    });

    it('attaches no listeners for someone who refused', async () => {
      const analytics = setup();
      TestBed.inject(ConsentService).decline();
      analytics.initialize();

      await TestBed.inject(Router).navigateByUrl('/servicos');
      clickLink('tel:+351933678865');

      expect(window.dataLayer).toBeUndefined();
    });

    // gtag.js cannot be unloaded once fetched, so the guarantee is that
    // nothing more is *sent*. It has stored nothing either way.
    it('stops sending the moment consent is withdrawn mid-visit', async () => {
      const analytics = setup();
      analytics.initialize();
      await TestBed.inject(Router).navigateByUrl('/');

      const before = eventsNamed('page_view').length;
      expect(before).toBe(1);

      TestBed.inject(ConsentService).decline();
      await TestBed.inject(Router).navigateByUrl('/servicos');
      clickLink('tel:+351933678865');

      expect(eventsNamed('page_view').length).toBe(before);
      expect(eventsNamed('phone_click').length).toBe(0);
    });

    it('keeps measuring for someone who accepted', async () => {
      const analytics = setup();
      TestBed.inject(ConsentService).accept();
      analytics.initialize();
      await TestBed.inject(Router).navigateByUrl('/');

      expect(eventsNamed('page_view').length).toBe(1);
    });

    // Everything below guards the same defect: GA4 reports nothing it cannot
    // attach a client id to. A hit sent with `analytics_storage: denied` is a
    // cookieless ping — accepted by Google, shown in no report, Realtime and
    // DebugView included. Measuring every visitor as denied therefore produces
    // a property that is permanently empty while looking perfectly wired up,
    // which is exactly how this shipped and went unnoticed.
    it('grants analytics storage for a visitor who accepted on an earlier visit', () => {
      const analytics = setup();
      TestBed.inject(ConsentService).accept();
      analytics.initialize();

      expect(pushed().find((args) => args[0] === 'consent')?.[2]).toMatchObject({
        analytics_storage: 'granted',
      });
    });

    // The grant has to ride in the consent *default*, ahead of gtag.js. An
    // update arriving after the first page_view would leave the opening hit of
    // the session — the only hit of a one-page visit — unreportable.
    it('carries the returning visitor grant in the default, before gtag loads', () => {
      const analytics = setup();
      TestBed.inject(ConsentService).accept();
      analytics.initialize();

      const consentIndex = pushed().findIndex((args) => args[0] === 'consent');
      const configIndex = pushed().findIndex((args) => args[0] === 'config');
      expect(consentIndex).toBeLessThan(configIndex);
      expect(commandsNamed('consent').filter((args) => args[1] === 'update').length).toBe(0);
    });

    it('grants analytics storage the moment the notice is accepted mid-visit', () => {
      const analytics = setup();
      analytics.initialize();

      expect(pushed().find((args) => args[0] === 'consent')?.[2]).toMatchObject({
        analytics_storage: 'denied',
      });

      TestBed.inject(ConsentService).accept();
      TestBed.tick();

      const updates = commandsNamed('consent').filter((args) => args[1] === 'update');
      expect(updates.length).toBe(1);
      expect(updates[0][2]).toMatchObject({ analytics_storage: 'granted' });
    });

    // The site runs no advertising and has asked nobody about it. Accepting
    // anonymous measurement must not quietly turn personalisation on.
    it('leaves every advertising category denied after acceptance', () => {
      const analytics = setup();
      analytics.initialize();
      TestBed.inject(ConsentService).accept();
      TestBed.tick();

      const updates = commandsNamed('consent').filter((args) => args[1] === 'update');
      expect(updates[0][2]).not.toHaveProperty('ad_storage');
      expect(updates[0][2]).not.toHaveProperty('ad_user_data');
      expect(updates[0][2]).not.toHaveProperty('ad_personalization');
      expect(pushed().find((args) => args[0] === 'consent')?.[2]).toMatchObject({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    });

    it('sends the grant once, however often consent is re-affirmed', () => {
      const analytics = setup();
      analytics.initialize();
      const consent = TestBed.inject(ConsentService);

      consent.accept();
      TestBed.tick();
      consent.accept();
      TestBed.tick();

      expect(commandsNamed('consent').filter((args) => args[1] === 'update').length).toBe(1);
    });

    // Dropping our own events is not enough once storage has been granted: the
    // identifier is already on the visitor's device, and gtag does not clean up
    // after a revocation. Withdrawal that leaves the cookie behind is not
    // withdrawal.
    it('revokes analytics storage when consent is withdrawn after acceptance', () => {
      const analytics = setup();
      analytics.initialize();
      const consent = TestBed.inject(ConsentService);

      consent.accept();
      TestBed.tick();
      consent.decline();
      TestBed.tick();

      const updates = commandsNamed('consent').filter((args) => args[1] === 'update');
      expect(updates.at(-1)?.[2]).toMatchObject({ analytics_storage: 'denied' });
    });

    it('deletes the GA cookies on withdrawal', () => {
      document.cookie = '_ga=GA1.1.1096976600.1788115522; path=/';
      document.cookie = '_ga_034WR9J2NH=GS1.1.1788115522; path=/';
      expect(document.cookie).toContain('_ga=');

      const analytics = setup();
      analytics.initialize();
      const consent = TestBed.inject(ConsentService);

      consent.accept();
      TestBed.tick();
      consent.decline();
      TestBed.tick();

      expect(document.cookie).not.toContain('_ga=');
      expect(document.cookie).not.toContain('_ga_034WR9J2NH');
    });

    // Resetting from the settings page returns the visitor to "undecided",
    // which is a cookieless state — so the cookie must go with it.
    it('revokes when the decision is reset, not only when refused', () => {
      const analytics = setup();
      analytics.initialize();
      const consent = TestBed.inject(ConsentService);

      consent.accept();
      TestBed.tick();
      consent.reset();
      TestBed.tick();

      const updates = commandsNamed('consent').filter((args) => args[1] === 'update');
      expect(updates.at(-1)?.[2]).toMatchObject({ analytics_storage: 'denied' });
    });

    it('stays silent when refusing without ever having granted', () => {
      const analytics = setup();
      analytics.initialize();

      TestBed.inject(ConsentService).decline();
      TestBed.tick();

      expect(commandsNamed('consent').filter((args) => args[1] === 'update').length).toBe(0);
    });

    it('grants nothing while the visitor has not answered the notice', () => {
      setup().initialize();
      TestBed.tick();

      expect(commandsNamed('consent').filter((args) => args[1] === 'update').length).toBe(0);
      expect(pushed().find((args) => args[0] === 'consent')?.[2]).toMatchObject({
        analytics_storage: 'denied',
      });
    });
  });
});
