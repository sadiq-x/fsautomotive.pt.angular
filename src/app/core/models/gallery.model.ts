/** A photograph of the workshop, used by the carousel and the gallery grid. */
export interface GalleryImage {
  /** Full-size source, also the `src` fallback for browsers without `srcset`. */
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
  /** Intrinsic size of `src`, used to reserve layout space and avoid CLS. */
  readonly width: number;
  readonly height: number;
  /**
   * Narrower renditions available as `<basename>-<width>.<ext>` siblings of
   * `src`. `ResponsiveImage` turns these into a `srcset`.
   */
  readonly widths?: readonly number[];
}
