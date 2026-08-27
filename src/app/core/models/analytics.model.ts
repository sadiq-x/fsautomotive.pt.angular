/**
 * Typed contracts for the Google Analytics 4 layer.
 *
 * The event names below are the whole vocabulary the site sends — anything not
 * listed here is a compile error at the call site. That is deliberate: a
 * mistyped event name is invisible in GA4 (it just creates a new, empty event)
 * and would otherwise only surface weeks later, in a report nobody can explain.
 */

/** Resolved analytics settings, supplied through `ANALYTICS_CONFIG`. */
export interface AnalyticsConfig {
  /** GA4 Measurement ID, or `''` when the build injected nothing. */
  readonly measurementId: string;
  /** `false` disables everything: no script, no request, no listener. */
  readonly enabled: boolean;
  /** Sends `debug_mode`, which is what makes GA4's DebugView work. */
  readonly debug: boolean;
  /**
   * Always `false`. GA4's automatic page view fires once per document load, so
   * in a single-page app it would only ever report the landing page. Views are
   * sent by the router integration instead.
   */
  readonly sendPageView: false;
}

/**
 * Every event the site sends.
 *
 * The three contact events are the conversion surface of a workshop site:
 * a visitor either calls, e-mails, or asks for directions. `tel:` and `mailto:`
 * clicks are invisible to GA4's enhanced measurement — it only instruments
 * outbound *http* links — so without these the site would report traffic and no
 * outcomes.
 */
export type GaEventName = 'page_view' | 'phone_click' | 'email_click' | 'directions_click';

/** Parameters for a router-driven page view. */
export interface PageViewParams {
  /** Path only — never the query string. See `AnalyticsService`. */
  readonly page_path: string;
  /** Full URL including query, which is where GA4 reads campaign tags from. */
  readonly page_location?: string;
  readonly page_title?: string;
}

/** Parameters shared by the three contact-link events. */
export interface ContactClickParams {
  /** The `href` that was clicked (`tel:`, `mailto:` or the maps URL). */
  readonly link_url: string;
  /** Visible text of the link, truncated — helps tell CTAs apart. */
  readonly link_text?: string;
  /** Which region of the page the link sits in: `header`, `footer`, `nav`… */
  readonly placement: string;
  /** The page the visitor converted from. */
  readonly page_path: string;
}

/** Maps each event name to the parameters it accepts. */
export interface GaEventParams {
  readonly page_view: PageViewParams;
  readonly phone_click: ContactClickParams;
  readonly email_click: ContactClickParams;
  readonly directions_click: ContactClickParams;
}

/** The parameter type for one event name. */
export type EventParamsFor<T extends GaEventName> = GaEventParams[T];

/** A name paired with its own parameters — the two can never drift apart. */
export type AnalyticsEvent = {
  [K in GaEventName]: { readonly name: K; readonly params: EventParamsFor<K> };
}[GaEventName];

/** A GA4 user property value. Objects and arrays are not supported by gtag. */
export type UserPropertyValue = string | number | boolean;

/**
 * What the visitor has said about anonymous measurement.
 *
 * `unknown` is not a refusal: the site measures without cookies or any
 * identifier, which needs no prior consent, so measurement runs while the
 * notice is still on screen. It is `declined` that changes behaviour.
 */
export type ConsentDecision = 'unknown' | 'accepted' | 'declined';
