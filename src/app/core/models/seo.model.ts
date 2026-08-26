/** Per-route metadata resolved by `SeoService` from the router's `data`. */
export interface PageMeta {
  readonly title: string;
  readonly description: string;
  /** Absolute or root-relative path used for the canonical URL. */
  readonly path: string;
  readonly image?: string;
}
