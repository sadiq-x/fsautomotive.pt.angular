/** Per-route metadata resolved by `SeoService` from the router's `data`. */
export interface PageMeta {
  readonly title: string;
  readonly description: string;
  /** Absolute or root-relative path used for the canonical URL. */
  readonly path: string;
  readonly image?: string;
  /**
   * Keeps the page out of search indexes.
   *
   * Set on every private route. A management area has no business in a search
   * result — and `robots.txt` cannot express it, because the site is a single
   * page application served from one HTML file.
   */
  readonly noIndex?: boolean;
}
