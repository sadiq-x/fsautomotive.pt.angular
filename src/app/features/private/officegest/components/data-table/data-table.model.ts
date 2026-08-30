/**
 * How a table column is declared.
 *
 * A column is data, not markup: pages describe *what* to show and the table
 * decides *how*. That is what makes four entity tables one component instead of
 * four near-identical templates, and it keeps responsive behaviour, sorting,
 * alignment and the header/cell relationship in a single place.
 *
 * `value` returns a display string rather than a template, deliberately. Every
 * cell in this area is text or a small badge, so a full template API would be
 * ceremony — and a string is trivially sortable and testable.
 */
export interface TableColumn<T> {
  /** Stable identifier, used for sorting and `track`. */
  readonly key: string;
  readonly header: string;
  /** The cell's text. Return `null` for "no value" and the table shows a dash. */
  readonly value: (row: T) => string | null;
  /**
   * Sort key. Omit to make the column unsortable — which is right for anything
   * whose display string does not order meaningfully.
   */
  readonly sortValue?: (row: T) => string | number | null;
  readonly align?: 'start' | 'end';
  /**
   * Priority on narrow screens. `primary` and `secondary` form the two lines of
   * the mobile card; `detail` columns appear as labelled pairs beneath; `hidden`
   * drops out entirely below the table breakpoint.
   */
  readonly priority?: 'primary' | 'secondary' | 'detail' | 'hidden';
  /** Renders as a status pill rather than plain text. */
  readonly badge?: boolean;
  /** Tabular figures, for money and counts that should align on the decimal. */
  readonly numeric?: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  readonly key: string;
  readonly direction: SortDirection;
}
