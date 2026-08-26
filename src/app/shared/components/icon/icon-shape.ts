/**
 * A single primitive inside an icon's 24×24 viewBox.
 *
 * Every field is optional so templates can bind `[attr.*]` without narrowing a
 * discriminated union; the `shape` helpers below are the type-safe way to build
 * them, so the widened type never has to be written by hand.
 */
export interface IconShape {
  readonly kind: 'path' | 'circle' | 'rect' | 'line' | 'polyline';
  readonly d?: string;
  readonly cx?: number;
  readonly cy?: number;
  readonly r?: number;
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly rx?: number;
  readonly x1?: number;
  readonly y1?: number;
  readonly x2?: number;
  readonly y2?: number;
  readonly points?: string;
  /** Renders the shape filled with `currentColor` instead of stroked. */
  readonly filled?: boolean;
}

export const path = (d: string, filled = false): IconShape => ({ kind: 'path', d, filled });

export const circle = (cx: number, cy: number, r: number, filled = false): IconShape => ({
  kind: 'circle',
  cx,
  cy,
  r,
  filled,
});

export const rect = (x: number, y: number, width: number, height: number, rx = 0): IconShape => ({
  kind: 'rect',
  x,
  y,
  width,
  height,
  rx,
});

export const line = (x1: number, y1: number, x2: number, y2: number): IconShape => ({
  kind: 'line',
  x1,
  y1,
  x2,
  y2,
});

export const polyline = (points: string): IconShape => ({ kind: 'polyline', points });
