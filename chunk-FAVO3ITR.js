import {
  StatePanel,
  StatusBadge
} from "./chunk-2LZNZMJ7.js";
import {
  toObservable,
  toSignal
} from "./chunk-TZW5CK7K.js";
import {
  ApiError
} from "./chunk-4AV4IBWC.js";
import {
  Icon
} from "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  Input,
  NgTemplateOutlet,
  Output,
  Router,
  RouterLink,
  __spreadProps,
  __spreadValues,
  catchError,
  computed,
  effect,
  inject,
  input,
  map,
  of,
  output,
  scan,
  setClassMetadata,
  signal,
  startWith,
  switchMap,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/officegest/services/resource-list.store.ts
var DEFAULT_PER_PAGE = 25;
var PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
function defaultHasActiveFilters(filters) {
  return Object.values(filters).some((value) => value !== void 0 && value !== null && value !== "");
}
function reduce(previous, event) {
  switch (event.kind) {
    case "loading":
      return __spreadProps(__spreadValues({}, previous), { status: "loading", error: null });
    case "loaded":
      return {
        status: "ready",
        items: event.page.items,
        pagination: event.page.pagination,
        error: null
      };
    case "failed":
      return { status: "error", items: [], pagination: previous.pagination, error: event.error };
  }
}
function createResourceList(options) {
  const injector = options.injector ?? inject(Injector);
  const filters = signal(options.initialFilters, ...ngDevMode ? [{ debugName: "filters" }] : (
    /* istanbul ignore next */
    []
  ));
  const page = signal(1, ...ngDevMode ? [{ debugName: "page" }] : (
    /* istanbul ignore next */
    []
  ));
  const perPage = signal(options.perPage ?? DEFAULT_PER_PAGE, ...ngDevMode ? [{ debugName: "perPage" }] : (
    /* istanbul ignore next */
    []
  ));
  const tick = signal(0, ...ngDevMode ? [{ debugName: "tick" }] : (
    /* istanbul ignore next */
    []
  ));
  const query = computed(() => ({
    filters: filters(),
    page: page(),
    perPage: perPage(),
    // Read so the computed depends on it. Never sent to the backend.
    tick: tick()
  }), ...ngDevMode ? [{ debugName: "query" }] : (
    /* istanbul ignore next */
    []
  ));
  const initialView = {
    status: "loading",
    items: [],
    pagination: null,
    error: null
  };
  const view = toSignal(toObservable(query, { injector }).pipe(
    switchMap((current) => options.fetch(__spreadProps(__spreadValues({}, current.filters), {
      page: current.page,
      perPage: current.perPage
    })).pipe(map((loaded) => ({ kind: "loaded", page: loaded })), catchError((error) => of({
      kind: "failed",
      error: error instanceof ApiError ? error : new ApiError(0, "UNKNOWN", "N\xE3o foi poss\xEDvel carregar os dados.")
    })), startWith({ kind: "loading" }))),
    // Outside `switchMap`, so the fold accumulates across queries rather than
    // restarting with each one.
    scan(reduce, initialView)
  ), { initialValue: initialView, injector });
  const items = computed(() => view().items, ...ngDevMode ? [{ debugName: "items" }] : (
    /* istanbul ignore next */
    []
  ));
  const status = computed(() => view().status, ...ngDevMode ? [{ debugName: "status" }] : (
    /* istanbul ignore next */
    []
  ));
  const hasActiveFilters = options.hasActiveFilters ?? defaultHasActiveFilters;
  return {
    items,
    status,
    pagination: computed(() => view().pagination ?? { page: page(), perPage: perPage() }),
    error: computed(() => view().error),
    isEmpty: computed(() => status() === "ready" && items().length === 0),
    isFiltered: computed(() => hasActiveFilters(filters())),
    filters: filters.asReadonly(),
    page: page.asReadonly(),
    perPage: perPage.asReadonly(),
    isRefreshing: computed(() => status() === "loading" && items().length > 0),
    setFilters(patch) {
      filters.update((current) => __spreadValues(__spreadValues({}, current), patch));
      page.set(1);
    },
    setPage(next) {
      page.set(Math.max(1, next));
    },
    setPerPage(next) {
      perPage.set(next);
      page.set(1);
    },
    reload() {
      tick.update((value) => value + 1);
    }
  };
}

// src/app/features/private/officegest/components/data-table/data-table.ts
var _c0 = (a0) => ({ $implicit: a0 });
var _forTrack0 = ($index, $item) => $item.key;
function _forTrack1($index, $item) {
  return this.rowKey()($item);
}
function DataTable_For_8_Conditional_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-icon", 14);
  }
  if (rf & 2) {
    \u0275\u0275classMap(ctx === "asc" ? "rotate-180" : "");
    \u0275\u0275property("size", 14);
  }
}
function DataTable_For_8_Conditional_1_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-icon", 13);
  }
  if (rf & 2) {
    \u0275\u0275property("size", 14);
  }
}
function DataTable_For_8_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 11);
    \u0275\u0275listener("click", function DataTable_For_8_Conditional_1_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const column_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.toggleSort(column_r2));
    });
    \u0275\u0275text(1);
    \u0275\u0275conditionalCreate(2, DataTable_For_8_Conditional_1_Conditional_2_Template, 1, 3, "app-icon", 12)(3, DataTable_For_8_Conditional_1_Conditional_3_Template, 1, 1, "app-icon", 13);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_13_0;
    const column_r2 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", column_r2.header, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_13_0 = ctx_r2.sortDirectionOf(column_r2)) ? 2 : 3, tmp_13_0);
  }
}
function DataTable_For_8_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const column_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275textInterpolate1(" ", column_r2.header, " ");
  }
}
function DataTable_For_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 9);
    \u0275\u0275conditionalCreate(1, DataTable_For_8_Conditional_1_Template, 4, 2, "button", 10)(2, DataTable_For_8_Conditional_2_Template, 1, 1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const column_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classMap("px-4 py-3 text-meta font-semibold tracking-wide text-ink-500 uppercase " + (column_r2.align === "end" ? "text-right" : "text-left"));
    \u0275\u0275attribute("aria-sort", ctx_r2.ariaSortOf(column_r2));
    \u0275\u0275advance();
    \u0275\u0275conditional(column_r2.sortValue ? 1 : 2);
  }
}
function DataTable_For_11_For_2_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-status-badge", 16);
  }
  if (rf & 2) {
    const column_r6 = \u0275\u0275nextContext().$implicit;
    const row_r5 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("label", ctx_r2.cellText(column_r6, row_r5));
  }
}
function DataTable_For_11_For_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const column_r6 = \u0275\u0275nextContext().$implicit;
    const row_r5 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("routerLink", ctx);
    \u0275\u0275attribute("aria-label", ctx_r2.labelFor(row_r5));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.cellText(column_r6, row_r5));
  }
}
function DataTable_For_11_For_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const column_r6 = \u0275\u0275nextContext().$implicit;
    const row_r5 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate1(" ", ctx_r2.cellText(column_r6, row_r5), " ");
  }
}
function DataTable_For_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td");
    \u0275\u0275conditionalCreate(1, DataTable_For_11_For_2_Conditional_1_Template, 1, 1, "app-status-badge", 16)(2, DataTable_For_11_For_2_Conditional_2_Template, 2, 3, "a", 17)(3, DataTable_For_11_For_2_Conditional_3_Template, 1, 1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_22_0;
    const column_r6 = ctx.$implicit;
    const row_r5 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classMap("px-4 py-3.5 text-body " + (column_r6.align === "end" ? "text-right " : "") + (column_r6.numeric ? "tabular-nums " : "") + (column_r6.priority === "primary" ? "font-semibold text-ink-900" : "text-ink-600"));
    \u0275\u0275advance();
    \u0275\u0275conditional(column_r6.badge && ctx_r2.hasValue(column_r6, row_r5) ? 1 : (tmp_22_0 = column_r6.priority === "primary" && ctx_r2.linkFor(row_r5)) ? 2 : 3, tmp_22_0);
  }
}
function DataTable_For_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr", 15);
    \u0275\u0275listener("click", function DataTable_For_11_Template_tr_click_0_listener($event) {
      const row_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onRowClick(row_r5, $event));
    });
    \u0275\u0275repeaterCreate(1, DataTable_For_11_For_2_Template, 4, 3, "td", 6, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r5 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classMap("border-b border-ink-950/6 transition-colors last:border-0 " + (ctx_r2.linkFor(row_r5) ? "cursor-pointer hover:bg-bone-100/70" : ""));
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.visibleColumns());
  }
}
function DataTable_For_14_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 18);
    \u0275\u0275elementContainer(1, 20);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r7 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    const cardBody_r8 = \u0275\u0275reference(16);
    \u0275\u0275property("routerLink", ctx);
    \u0275\u0275attribute("aria-label", ctx_r2.labelFor(row_r7));
    \u0275\u0275advance();
    \u0275\u0275property("ngTemplateOutlet", cardBody_r8)("ngTemplateOutletContext", \u0275\u0275pureFunction1(4, _c0, row_r7));
  }
}
function DataTable_For_14_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 19);
    \u0275\u0275elementContainer(1, 20);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r7 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275nextContext();
    const cardBody_r8 = \u0275\u0275reference(16);
    \u0275\u0275advance();
    \u0275\u0275property("ngTemplateOutlet", cardBody_r8)("ngTemplateOutletContext", \u0275\u0275pureFunction1(2, _c0, row_r7));
  }
}
function DataTable_For_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 8);
    \u0275\u0275conditionalCreate(1, DataTable_For_14_Conditional_1_Template, 2, 6, "a", 18)(2, DataTable_For_14_Conditional_2_Template, 2, 4, "div", 19);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_11_0;
    const row_r7 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_11_0 = ctx_r2.linkFor(row_r7)) ? 1 : 2, tmp_11_0);
  }
}
function DataTable_ng_template_15_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 23);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r9 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.cellText(ctx, row_r9));
  }
}
function DataTable_ng_template_15_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 24);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r9 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.cellText(ctx, row_r9));
  }
}
function DataTable_ng_template_15_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-icon", 25);
  }
  if (rf & 2) {
    \u0275\u0275property("size", 18);
  }
}
function DataTable_ng_template_15_Conditional_5_For_2_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-status-badge", 16);
  }
  if (rf & 2) {
    const column_r10 = \u0275\u0275nextContext().$implicit;
    const row_r9 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("label", ctx_r2.cellText(column_r10, row_r9));
  }
}
function DataTable_ng_template_15_Conditional_5_For_2_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const column_r10 = \u0275\u0275nextContext().$implicit;
    const row_r9 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate1(" ", ctx_r2.cellText(column_r10, row_r9), " ");
  }
}
function DataTable_ng_template_15_Conditional_5_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 22)(1, "dt", 27);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "dd", 28);
    \u0275\u0275conditionalCreate(4, DataTable_ng_template_15_Conditional_5_For_2_Conditional_4_Template, 1, 1, "app-status-badge", 16)(5, DataTable_ng_template_15_Conditional_5_For_2_Conditional_5_Template, 1, 1);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const column_r10 = ctx.$implicit;
    const row_r9 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(column_r10.header);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(column_r10.badge && ctx_r2.hasValue(column_r10, row_r9) ? 4 : 5);
  }
}
function DataTable_ng_template_15_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "dl", 26);
    \u0275\u0275repeaterCreate(1, DataTable_ng_template_15_Conditional_5_For_2_Template, 6, 2, "div", 22, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.detailColumns());
  }
}
function DataTable_ng_template_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 21)(1, "div", 22);
    \u0275\u0275conditionalCreate(2, DataTable_ng_template_15_Conditional_2_Template, 2, 1, "p", 23);
    \u0275\u0275conditionalCreate(3, DataTable_ng_template_15_Conditional_3_Template, 2, 1, "p", 24);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(4, DataTable_ng_template_15_Conditional_4_Template, 1, 1, "app-icon", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275conditionalCreate(5, DataTable_ng_template_15_Conditional_5_Template, 3, 0, "dl", 26);
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    const row_r9 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275conditional((tmp_3_0 = ctx_r2.primaryColumn()) ? 2 : -1, tmp_3_0);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_4_0 = ctx_r2.secondaryColumn()) ? 3 : -1, tmp_4_0);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.linkFor(row_r9) ? 4 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.detailColumns().length ? 5 : -1);
  }
}
var DataTable = class _DataTable {
  router = inject(Router);
  columns = input.required(...ngDevMode ? [{ debugName: "columns" }] : (
    /* istanbul ignore next */
    []
  ));
  rows = input.required(...ngDevMode ? [{ debugName: "rows" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Stable identity per row, for `track` and as the row's DOM id. */
  rowKey = input.required(...ngDevMode ? [{ debugName: "rowKey" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Describes the table for screen readers, e.g. "Lista de clientes". */
  caption = input.required(...ngDevMode ? [{ debugName: "caption" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Dims the body while the next page loads, without removing it. */
  refreshing = input(false, ...ngDevMode ? [{ debugName: "refreshing" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Destination for each row. Omit for a read-only table. */
  rowLink = input(null, ...ngDevMode ? [{ debugName: "rowLink" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Accessible name for the row's link, e.g. "Ver Ana Silva". */
  rowLabel = input(null, ...ngDevMode ? [{ debugName: "rowLabel" }] : (
    /* istanbul ignore next */
    []
  ));
  sort = signal(null, ...ngDevMode ? [{ debugName: "sort" }] : (
    /* istanbul ignore next */
    []
  ));
  /** The active sort, so the page can explain that it applies to this page only. */
  sortState = this.sort.asReadonly();
  visibleColumns = computed(() => this.columns().filter((column) => column.priority !== "hidden"), ...ngDevMode ? [{ debugName: "visibleColumns" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Columns shown in the mobile card body, in declaration order. */
  detailColumns = computed(() => this.columns().filter((column) => (column.priority ?? "detail") === "detail"), ...ngDevMode ? [{ debugName: "detailColumns" }] : (
    /* istanbul ignore next */
    []
  ));
  primaryColumn = computed(() => this.columns().find((column) => column.priority === "primary") ?? this.columns()[0], ...ngDevMode ? [{ debugName: "primaryColumn" }] : (
    /* istanbul ignore next */
    []
  ));
  secondaryColumn = computed(() => this.columns().find((column) => column.priority === "secondary"), ...ngDevMode ? [{ debugName: "secondaryColumn" }] : (
    /* istanbul ignore next */
    []
  ));
  sortedRows = computed(() => {
    const state = this.sort();
    const rows = this.rows();
    if (!state) {
      return rows;
    }
    const column = this.columns().find((candidate) => candidate.key === state.key);
    if (!column?.sortValue) {
      return rows;
    }
    const factor = state.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = column.sortValue(a);
      const right = column.sortValue(b);
      if (left === null || right === null) {
        return left === right ? 0 : left === null ? 1 : -1;
      }
      return factor * compare(left, right);
    });
  }, ...ngDevMode ? [{ debugName: "sortedRows" }] : (
    /* istanbul ignore next */
    []
  ));
  toggleSort(column) {
    if (!column.sortValue) {
      return;
    }
    this.sort.update((current) => {
      if (current?.key !== column.key) {
        return { key: column.key, direction: "asc" };
      }
      return current.direction === "asc" ? { key: column.key, direction: "desc" } : null;
    });
  }
  sortDirectionOf(column) {
    const state = this.sort();
    return state?.key === column.key ? state.direction : null;
  }
  /** `aria-sort`, so a screen reader announces the column's state. */
  ariaSortOf(column) {
    if (!column.sortValue) {
      return null;
    }
    const direction = this.sortDirectionOf(column);
    return direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none";
  }
  cellText(column, row) {
    return column.value(row) ?? "\u2014";
  }
  hasValue(column, row) {
    return column.value(row) !== null;
  }
  linkFor(row) {
    return this.rowLink()?.(row) ?? null;
  }
  labelFor(row) {
    return this.rowLabel()?.(row) ?? null;
  }
  /**
   * Mouse convenience: clicking anywhere in the row follows its link.
   *
   * Clicks that already landed on a link or a button are ignored, so the
   * anchor's own navigation is not duplicated and a future row action would
   * still work.
   */
  onRowClick(row, event) {
    const target = event.target;
    if (target?.closest("a, button")) {
      return;
    }
    const link = this.linkFor(row);
    if (link) {
      void this.router.navigateByUrl(link);
    }
  }
  static \u0275fac = function DataTable_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DataTable)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DataTable, selectors: [["app-data-table"]], hostAttrs: [1, "block"], inputs: { columns: [1, "columns"], rows: [1, "rows"], rowKey: [1, "rowKey"], caption: [1, "caption"], refreshing: [1, "refreshing"], rowLink: [1, "rowLink"], rowLabel: [1, "rowLabel"] }, decls: 17, vars: 5, consts: [["cardBody", ""], [1, "hidden", "lg:block"], [1, "w-full", "border-collapse", "text-left"], [1, "sr-only"], [1, "border-b", "border-ink-950/10"], ["scope", "col", 3, "class"], [3, "class"], ["role", "list"], [1, "rounded-xl", "bg-white", "shadow-card", "ring-1", "ring-ink-950/6"], ["scope", "col"], ["type", "button", 1, "group/sort", "inline-flex", "items-center", "gap-1.5", "rounded-sm", "transition-colors", "hover:text-ink-900", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600"], ["type", "button", 1, "group/sort", "inline-flex", "items-center", "gap-1.5", "rounded-sm", "transition-colors", "hover:text-ink-900", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", 3, "click"], ["name", "chevron-down", 3, "size", "class"], ["name", "chevron-down", 1, "opacity-0", "transition-opacity", "group-hover/sort:opacity-40", 3, "size"], ["name", "chevron-down", 3, "size"], [3, "click"], [3, "label"], [1, "rounded-sm", "underline-offset-4", "hover:underline", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", 3, "routerLink"], [1, "block", "rounded-xl", "p-4", "transition-shadow", "hover:shadow-card-hover", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", 3, "routerLink"], [1, "p-4"], [3, "ngTemplateOutlet", "ngTemplateOutletContext"], [1, "flex", "items-start", "justify-between", "gap-3"], [1, "min-w-0"], [1, "truncate", "font-semibold", "text-ink-900"], [1, "mt-0.5", "truncate", "text-meta", "text-ink-500"], ["name", "chevron-right", 1, "mt-0.5", "shrink-0", "text-ink-300", 3, "size"], [1, "mt-3", "grid", "grid-cols-2", "gap-x-4", "gap-y-2", "border-t", "border-ink-950/6", "pt-3"], [1, "text-meta", "text-ink-400"], [1, "mt-0.5", "truncate", "text-body", "text-ink-700"]], template: function DataTable_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 1)(1, "div")(2, "table", 2)(3, "caption", 3);
      \u0275\u0275text(4);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "thead")(6, "tr", 4);
      \u0275\u0275repeaterCreate(7, DataTable_For_8_Template, 3, 4, "th", 5, _forTrack0);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(9, "tbody");
      \u0275\u0275repeaterCreate(10, DataTable_For_11_Template, 3, 2, "tr", 6, _forTrack1, true);
      \u0275\u0275elementEnd()()()();
      \u0275\u0275elementStart(12, "ul", 7);
      \u0275\u0275repeaterCreate(13, DataTable_For_14_Template, 3, 1, "li", 8, _forTrack1, true);
      \u0275\u0275elementEnd();
      \u0275\u0275template(15, DataTable_ng_template_15_Template, 6, 4, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275classMap(ctx.refreshing() ? "opacity-60 transition-opacity duration-200" : "");
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate1(" ", ctx.caption(), " ");
      \u0275\u0275advance(3);
      \u0275\u0275repeater(ctx.visibleColumns());
      \u0275\u0275advance(3);
      \u0275\u0275repeater(ctx.sortedRows());
      \u0275\u0275advance(2);
      \u0275\u0275classMap("space-y-3 lg:hidden " + (ctx.refreshing() ? "opacity-60 transition-opacity duration-200" : ""));
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.sortedRows());
    }
  }, dependencies: [Icon, NgTemplateOutlet, RouterLink, StatusBadge], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DataTable, [{
    type: Component,
    args: [{ selector: "app-data-table", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon, NgTemplateOutlet, RouterLink, StatusBadge], host: { class: "block" }, template: `<!-- Desktop: a real table, because the data is genuinely tabular and screen
     readers, sorting and column headers all depend on the semantics. -->
<div class="hidden lg:block">
  <div [class]="refreshing() ? 'opacity-60 transition-opacity duration-200' : ''">
    <table class="w-full border-collapse text-left">
      <caption class="sr-only">
        {{
          caption()
        }}
      </caption>
      <thead>
        <tr class="border-b border-ink-950/10">
          @for (column of visibleColumns(); track column.key) {
            <th
              scope="col"
              [attr.aria-sort]="ariaSortOf(column)"
              [class]="
                'px-4 py-3 text-meta font-semibold tracking-wide text-ink-500 uppercase ' +
                (column.align === 'end' ? 'text-right' : 'text-left')
              "
            >
              @if (column.sortValue) {
                <button
                  type="button"
                  class="group/sort inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  (click)="toggleSort(column)"
                >
                  {{ column.header }}
                  @if (sortDirectionOf(column); as direction) {
                    <!-- One glyph, rotated: two icons would drift apart in
                         weight and optical size for no gain. -->
                    <app-icon
                      name="chevron-down"
                      [size]="14"
                      [class]="direction === 'asc' ? 'rotate-180' : ''"
                    />
                  } @else {
                    <app-icon
                      name="chevron-down"
                      [size]="14"
                      class="opacity-0 transition-opacity group-hover/sort:opacity-40"
                    />
                  }
                </button>
              } @else {
                {{ column.header }}
              }
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of sortedRows(); track rowKey()(row)) {
          <!-- No \`role\` or \`tabindex\` here on purpose: overriding a row's
               implicit role would remove it from the table's accessibility
               tree. The link in the first cell carries the keyboard and
               screen-reader path; this handler is only a mouse convenience. -->
          <tr
            [class]="
              'border-b border-ink-950/6 transition-colors last:border-0 ' +
              (linkFor(row) ? 'cursor-pointer hover:bg-bone-100/70' : '')
            "
            (click)="onRowClick(row, $event)"
          >
            @for (column of visibleColumns(); track column.key) {
              <td
                [class]="
                  'px-4 py-3.5 text-body ' +
                  (column.align === 'end' ? 'text-right ' : '') +
                  (column.numeric ? 'tabular-nums ' : '') +
                  (column.priority === 'primary' ? 'font-semibold text-ink-900' : 'text-ink-600')
                "
              >
                @if (column.badge && hasValue(column, row)) {
                  <app-status-badge [label]="cellText(column, row)" />
                } @else if (column.priority === 'primary' && linkFor(row); as link) {
                  <a
                    class="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    [routerLink]="link"
                    [attr.aria-label]="labelFor(row)"
                    >{{ cellText(column, row) }}</a
                  >
                } @else {
                  {{ cellText(column, row) }}
                }
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  </div>
</div>

<!-- Below \`lg\`: cards. A table narrower than its content would either scroll
     sideways or crush every column; neither is usable on a phone.
     The whole card is one anchor, so it is a single tab stop with a real
     destination rather than a div pretending to be a link. -->
<ul
  role="list"
  [class]="'space-y-3 lg:hidden ' + (refreshing() ? 'opacity-60 transition-opacity duration-200' : '')"
>
  @for (row of sortedRows(); track rowKey()(row)) {
    <li class="rounded-xl bg-white shadow-card ring-1 ring-ink-950/6">
      @if (linkFor(row); as link) {
        <a
          class="block rounded-xl p-4 transition-shadow hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          [routerLink]="link"
          [attr.aria-label]="labelFor(row)"
        >
          <ng-container [ngTemplateOutlet]="cardBody" [ngTemplateOutletContext]="{ $implicit: row }" />
        </a>
      } @else {
        <div class="p-4">
          <ng-container [ngTemplateOutlet]="cardBody" [ngTemplateOutletContext]="{ $implicit: row }" />
        </div>
      }
    </li>
  }
</ul>

<!-- One definition of the card, used whether or not the row is a link. -->
<ng-template #cardBody let-row>
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      @if (primaryColumn(); as primary) {
        <p class="truncate font-semibold text-ink-900">{{ cellText(primary, row) }}</p>
      }
      @if (secondaryColumn(); as secondary) {
        <p class="mt-0.5 truncate text-meta text-ink-500">{{ cellText(secondary, row) }}</p>
      }
    </div>
    @if (linkFor(row)) {
      <app-icon name="chevron-right" [size]="18" class="mt-0.5 shrink-0 text-ink-300" />
    }
  </div>

  @if (detailColumns().length) {
    <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-ink-950/6 pt-3">
      @for (column of detailColumns(); track column.key) {
        <div class="min-w-0">
          <dt class="text-meta text-ink-400">{{ column.header }}</dt>
          <dd class="mt-0.5 truncate text-body text-ink-700">
            @if (column.badge && hasValue(column, row)) {
              <app-status-badge [label]="cellText(column, row)" />
            } @else {
              {{ cellText(column, row) }}
            }
          </dd>
        </div>
      }
    </dl>
  }
</ng-template>
` }]
  }], null, { columns: [{ type: Input, args: [{ isSignal: true, alias: "columns", required: true }] }], rows: [{ type: Input, args: [{ isSignal: true, alias: "rows", required: true }] }], rowKey: [{ type: Input, args: [{ isSignal: true, alias: "rowKey", required: true }] }], caption: [{ type: Input, args: [{ isSignal: true, alias: "caption", required: true }] }], refreshing: [{ type: Input, args: [{ isSignal: true, alias: "refreshing", required: false }] }], rowLink: [{ type: Input, args: [{ isSignal: true, alias: "rowLink", required: false }] }], rowLabel: [{ type: Input, args: [{ isSignal: true, alias: "rowLabel", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DataTable, { className: "DataTable", filePath: "src/app/features/private/officegest/components/data-table/data-table.ts", lineNumber: 53 });
})();
function compare(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b), "pt", { numeric: true, sensitivity: "base" });
}

// src/app/features/private/officegest/components/pagination-bar/pagination-bar.ts
function PaginationBar_For_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const size_r1 = ctx.$implicit;
    \u0275\u0275property("value", size_r1);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(size_r1);
  }
}
var PaginationBar = class _PaginationBar {
  pagination = input.required(...ngDevMode ? [{ debugName: "pagination" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Rows on the current page; a short page means there is no next one. */
  loadedCount = input.required(...ngDevMode ? [{ debugName: "loadedCount" }] : (
    /* istanbul ignore next */
    []
  ));
  disabled = input(false, ...ngDevMode ? [{ debugName: "disabled" }] : (
    /* istanbul ignore next */
    []
  ));
  pageChange = output();
  perPageChange = output();
  pageSizes = PAGE_SIZE_OPTIONS;
  page = computed(() => this.pagination().page, ...ngDevMode ? [{ debugName: "page" }] : (
    /* istanbul ignore next */
    []
  ));
  perPage = computed(() => this.pagination().perPage, ...ngDevMode ? [{ debugName: "perPage" }] : (
    /* istanbul ignore next */
    []
  ));
  total = computed(() => this.pagination().total, ...ngDevMode ? [{ debugName: "total" }] : (
    /* istanbul ignore next */
    []
  ));
  firstIndex = computed(() => this.loadedCount() === 0 ? 0 : (this.page() - 1) * this.perPage() + 1, ...ngDevMode ? [{ debugName: "firstIndex" }] : (
    /* istanbul ignore next */
    []
  ));
  lastIndex = computed(() => (this.page() - 1) * this.perPage() + this.loadedCount(), ...ngDevMode ? [{ debugName: "lastIndex" }] : (
    /* istanbul ignore next */
    []
  ));
  /** "26–50 de 130", or "26–50" when the upstream reported no total. */
  rangeLabel = computed(() => {
    if (this.loadedCount() === 0) {
      return "Sem resultados";
    }
    const range = `${this.firstIndex()}\u2013${this.lastIndex()}`;
    const total = this.total();
    return total === void 0 ? range : `${range} de ${total}`;
  }, ...ngDevMode ? [{ debugName: "rangeLabel" }] : (
    /* istanbul ignore next */
    []
  ));
  previousDisabled = computed(() => this.disabled() || this.page() <= 1, ...ngDevMode ? [{ debugName: "previousDisabled" }] : (
    /* istanbul ignore next */
    []
  ));
  nextDisabled = computed(() => {
    if (this.disabled()) {
      return true;
    }
    const total = this.total();
    if (total !== void 0) {
      return this.lastIndex() >= total;
    }
    return this.loadedCount() < this.perPage();
  }, ...ngDevMode ? [{ debugName: "nextDisabled" }] : (
    /* istanbul ignore next */
    []
  ));
  onPerPage(event) {
    this.perPageChange.emit(Number(event.target.value));
  }
  static \u0275fac = function PaginationBar_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PaginationBar)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PaginationBar, selectors: [["app-pagination-bar"]], hostAttrs: [1, "block"], inputs: { pagination: [1, "pagination"], loadedCount: [1, "loadedCount"], disabled: [1, "disabled"] }, outputs: { pageChange: "pageChange", perPageChange: "perPageChange" }, decls: 21, vars: 8, consts: [["aria-label", "Pagina\xE7\xE3o", 1, "flex", "flex-wrap", "items-center", "justify-between", "gap-4", "border-t", "border-ink-950/8", "px-1", "pt-4"], ["aria-live", "polite", 1, "text-meta", "text-ink-500"], [1, "flex", "items-center", "gap-4"], [1, "flex", "items-center", "gap-2", "text-meta", "text-ink-500"], [1, "rounded-lg", "border-0", "bg-white", "py-1.5", "pr-8", "pl-3", "text-meta", "text-ink-900", "ring-1", "ring-ink-950/8", "ring-inset", "focus:ring-2", "focus:ring-brand-600", "focus:outline-none", 3, "change", "value", "disabled"], [3, "value"], [1, "flex", "items-center", "gap-1"], ["type", "button", 1, "inline-flex", "size-9", "items-center", "justify-center", "rounded-full", "text-ink-600", "transition-colors", "hover:bg-ink-100", "hover:text-ink-900", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", "disabled:pointer-events-none", "disabled:opacity-35", 3, "click", "disabled"], [1, "sr-only"], ["name", "chevron-left", 3, "size"], [1, "min-w-16", "text-center", "text-meta", "font-semibold", "text-ink-700"], ["name", "chevron-right", 3, "size"]], template: function PaginationBar_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "nav", 0)(1, "p", 1);
      \u0275\u0275text(2);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "div", 2)(4, "label", 3)(5, "span");
      \u0275\u0275text(6, "Por p\xE1gina");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "select", 4);
      \u0275\u0275listener("change", function PaginationBar_Template_select_change_7_listener($event) {
        return ctx.onPerPage($event);
      });
      \u0275\u0275repeaterCreate(8, PaginationBar_For_9_Template, 2, 2, "option", 5, \u0275\u0275repeaterTrackByIdentity);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(10, "div", 6)(11, "button", 7);
      \u0275\u0275listener("click", function PaginationBar_Template_button_click_11_listener() {
        return ctx.pageChange.emit(ctx.page() - 1);
      });
      \u0275\u0275elementStart(12, "span", 8);
      \u0275\u0275text(13, "P\xE1gina anterior");
      \u0275\u0275elementEnd();
      \u0275\u0275element(14, "app-icon", 9);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(15, "span", 10);
      \u0275\u0275text(16);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(17, "button", 7);
      \u0275\u0275listener("click", function PaginationBar_Template_button_click_17_listener() {
        return ctx.pageChange.emit(ctx.page() + 1);
      });
      \u0275\u0275elementStart(18, "span", 8);
      \u0275\u0275text(19, "P\xE1gina seguinte");
      \u0275\u0275elementEnd();
      \u0275\u0275element(20, "app-icon", 11);
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.rangeLabel());
      \u0275\u0275advance(5);
      \u0275\u0275property("value", ctx.perPage())("disabled", ctx.disabled());
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.pageSizes);
      \u0275\u0275advance(3);
      \u0275\u0275property("disabled", ctx.previousDisabled());
      \u0275\u0275advance(3);
      \u0275\u0275property("size", 18);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" P\xE1gina ", ctx.page(), " ");
      \u0275\u0275advance();
      \u0275\u0275property("disabled", ctx.nextDisabled());
      \u0275\u0275advance(3);
      \u0275\u0275property("size", 18);
    }
  }, dependencies: [Icon], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PaginationBar, [{
    type: Component,
    args: [{ selector: "app-pagination-bar", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon], host: { class: "block" }, template: '<nav\n  class="flex flex-wrap items-center justify-between gap-4 border-t border-ink-950/8 px-1 pt-4"\n  aria-label="Pagina\xE7\xE3o"\n>\n  <p class="text-meta text-ink-500" aria-live="polite">{{ rangeLabel() }}</p>\n\n  <div class="flex items-center gap-4">\n    <label class="flex items-center gap-2 text-meta text-ink-500">\n      <span>Por p\xE1gina</span>\n      <select\n        class="rounded-lg border-0 bg-white py-1.5 pr-8 pl-3 text-meta text-ink-900 ring-1 ring-ink-950/8 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"\n        [value]="perPage()"\n        [disabled]="disabled()"\n        (change)="onPerPage($event)"\n      >\n        @for (size of pageSizes; track size) {\n          <option [value]="size">{{ size }}</option>\n        }\n      </select>\n    </label>\n\n    <div class="flex items-center gap-1">\n      <button\n        type="button"\n        class="inline-flex size-9 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-35"\n        [disabled]="previousDisabled()"\n        (click)="pageChange.emit(page() - 1)"\n      >\n        <span class="sr-only">P\xE1gina anterior</span>\n        <app-icon name="chevron-left" [size]="18" />\n      </button>\n\n      <span class="min-w-16 text-center text-meta font-semibold text-ink-700"> P\xE1gina {{ page() }} </span>\n\n      <button\n        type="button"\n        class="inline-flex size-9 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-35"\n        [disabled]="nextDisabled()"\n        (click)="pageChange.emit(page() + 1)"\n      >\n        <span class="sr-only">P\xE1gina seguinte</span>\n        <app-icon name="chevron-right" [size]="18" />\n      </button>\n    </div>\n  </div>\n</nav>\n' }]
  }], null, { pagination: [{ type: Input, args: [{ isSignal: true, alias: "pagination", required: true }] }], loadedCount: [{ type: Input, args: [{ isSignal: true, alias: "loadedCount", required: true }] }], disabled: [{ type: Input, args: [{ isSignal: true, alias: "disabled", required: false }] }], pageChange: [{ type: Output, args: ["pageChange"] }], perPageChange: [{ type: Output, args: ["perPageChange"] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PaginationBar, { className: "PaginationBar", filePath: "src/app/features/private/officegest/components/pagination-bar/pagination-bar.ts", lineNumber: 28 });
})();

// src/app/features/private/officegest/components/search-field/search-field.ts
function SearchField_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 6);
    \u0275\u0275listener("click", function SearchField_Conditional_6_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.clear());
    });
    \u0275\u0275elementStart(1, "span", 1);
    \u0275\u0275text(2, "Limpar pesquisa");
    \u0275\u0275elementEnd();
    \u0275\u0275element(3, "app-icon", 7);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(3);
    \u0275\u0275property("size", 16);
  }
}
var DEBOUNCE_MS = 350;
var MIN_LENGTH = 2;
var SearchField = class _SearchField {
  label = input.required(...ngDevMode ? [{ debugName: "label" }] : (
    /* istanbul ignore next */
    []
  ));
  placeholder = input("Pesquisar\u2026", ...ngDevMode ? [{ debugName: "placeholder" }] : (
    /* istanbul ignore next */
    []
  ));
  /** The committed value, so the field survives a navigation back to the page. */
  value = input("", ...ngDevMode ? [{ debugName: "value" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Emits the trimmed term, or `''` when the search is cleared. */
  search = output();
  draft = signal("", ...ngDevMode ? [{ debugName: "draft" }] : (
    /* istanbul ignore next */
    []
  ));
  timer = null;
  constructor() {
    effect(() => this.draft.set(this.value()));
  }
  onInput(event) {
    const raw = event.target.value;
    this.draft.set(raw);
    const term = raw.trim();
    if (term.length > 0 && term.length < MIN_LENGTH) {
      return;
    }
    this.schedule(term);
  }
  /** Enter commits immediately: the user has finished typing and said so. */
  onEnter() {
    this.cancel();
    const term = this.draft().trim();
    if (term.length === 0 || term.length >= MIN_LENGTH) {
      this.search.emit(term);
    }
  }
  clear() {
    this.cancel();
    this.draft.set("");
    this.search.emit("");
  }
  schedule(term) {
    this.cancel();
    this.timer = setTimeout(() => this.search.emit(term), DEBOUNCE_MS);
  }
  cancel() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
  static \u0275fac = function SearchField_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SearchField)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SearchField, selectors: [["app-search-field"]], hostAttrs: [1, "block"], inputs: { label: [1, "label"], placeholder: [1, "placeholder"], value: [1, "value"] }, outputs: { search: "search" }, decls: 7, vars: 5, consts: [[1, "relative", "block"], [1, "sr-only"], [1, "pointer-events-none", "absolute", "inset-y-0", "left-0", "flex", "items-center", "pl-3.5", "text-ink-400"], ["name", "search", 3, "size"], ["type", "search", "autocomplete", "off", 1, "w-full", "rounded-full", "border-0", "bg-white", "py-2.5", "pr-10", "pl-11", "text-body", "text-ink-900", "shadow-btn", "ring-1", "ring-ink-950/8", "transition-shadow", "ring-inset", "placeholder:text-ink-400", "focus:ring-2", "focus:ring-brand-600", "focus:outline-none", 3, "input", "keydown.enter", "keydown.escape", "placeholder", "value"], ["type", "button", 1, "absolute", "inset-y-0", "right-0", "flex", "items-center", "pr-3.5", "text-ink-400", "transition-colors", "hover:text-ink-700", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600"], ["type", "button", 1, "absolute", "inset-y-0", "right-0", "flex", "items-center", "pr-3.5", "text-ink-400", "transition-colors", "hover:text-ink-700", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", 3, "click"], ["name", "close", 3, "size"]], template: function SearchField_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "label", 0)(1, "span", 1);
      \u0275\u0275text(2);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "span", 2);
      \u0275\u0275element(4, "app-icon", 3);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "input", 4);
      \u0275\u0275listener("input", function SearchField_Template_input_input_5_listener($event) {
        return ctx.onInput($event);
      })("keydown.enter", function SearchField_Template_input_keydown_enter_5_listener() {
        return ctx.onEnter();
      })("keydown.escape", function SearchField_Template_input_keydown_escape_5_listener() {
        return ctx.clear();
      });
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(6, SearchField_Conditional_6_Template, 4, 1, "button", 5);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.label());
      \u0275\u0275advance(2);
      \u0275\u0275property("size", 18);
      \u0275\u0275advance();
      \u0275\u0275property("placeholder", ctx.placeholder())("value", ctx.draft());
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.draft() ? 6 : -1);
    }
  }, dependencies: [Icon], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SearchField, [{
    type: Component,
    args: [{ selector: "app-search-field", changeDetection: ChangeDetectionStrategy.OnPush, imports: [Icon], host: { class: "block" }, template: '<label class="relative block">\n  <span class="sr-only">{{ label() }}</span>\n\n  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-400">\n    <app-icon name="search" [size]="18" />\n  </span>\n\n  <input\n    type="search"\n    autocomplete="off"\n    class="w-full rounded-full border-0 bg-white py-2.5 pr-10 pl-11 text-body text-ink-900 shadow-btn ring-1 ring-ink-950/8 transition-shadow ring-inset placeholder:text-ink-400 focus:ring-2 focus:ring-brand-600 focus:outline-none"\n    [placeholder]="placeholder()"\n    [value]="draft()"\n    (input)="onInput($event)"\n    (keydown.enter)="onEnter()"\n    (keydown.escape)="clear()"\n  />\n\n  @if (draft()) {\n    <button\n      type="button"\n      class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-400 transition-colors hover:text-ink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"\n      (click)="clear()"\n    >\n      <span class="sr-only">Limpar pesquisa</span>\n      <app-icon name="close" [size]="16" />\n    </button>\n  }\n</label>\n' }]
  }], () => [], { label: [{ type: Input, args: [{ isSignal: true, alias: "label", required: true }] }], placeholder: [{ type: Input, args: [{ isSignal: true, alias: "placeholder", required: false }] }], value: [{ type: Input, args: [{ isSignal: true, alias: "value", required: false }] }], search: [{ type: Output, args: ["search"] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SearchField, { className: "SearchField", filePath: "src/app/features/private/officegest/components/search-field/search-field.ts", lineNumber: 33 });
})();

// src/app/features/private/officegest/components/resource-page/resource-page.ts
var _c02 = [[["", "slot", "actions"]], [["", "slot", "filters"]]];
var _c1 = ["[slot=actions]", "[slot=filters]"];
function ResourcePage_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 2);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.subtitle());
  }
}
function ResourcePage_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-search-field", 12);
    \u0275\u0275listener("search", function ResourcePage_Conditional_7_Template_app_search_field_search_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.search.emit($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("label", ctx)("placeholder", ctx_r0.searchPlaceholder())("value", ctx_r0.searchValue());
  }
}
function ResourcePage_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 5);
    \u0275\u0275text(1, "A atualizar\u2026");
    \u0275\u0275elementEnd();
  }
}
function ResourcePage_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-state-panel", 7);
  }
  if (rf & 2) {
    \u0275\u0275property("skeletonRows", 8);
  }
}
function ResourcePage_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-state-panel", 13);
    \u0275\u0275listener("action", function ResourcePage_Conditional_12_Template_app_state_panel_action_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.store().reload());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_1_0;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("message", ((tmp_1_0 = ctx_r0.store().error()) == null ? null : tmp_1_0.message) ?? null);
  }
}
function ResourcePage_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-state-panel", 14);
    \u0275\u0275listener("action", function ResourcePage_Conditional_13_Template_app_state_panel_action_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.store().reload());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("title", ctx_r0.emptyTitle())("message", ctx_r0.emptyMessage())("actionLabel", ctx_r0.store().isFiltered() ? null : "Atualizar");
  }
}
function ResourcePage_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 10);
    \u0275\u0275element(1, "app-data-table", 15);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("columns", ctx_r0.columns())("rows", ctx_r0.store().items())("rowKey", ctx_r0.rowKey())("caption", ctx_r0.caption())("refreshing", ctx_r0.store().isRefreshing())("rowLink", ctx_r0.rowLink())("rowLabel", ctx_r0.rowLabel());
  }
}
function ResourcePage_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-pagination-bar", 16);
    \u0275\u0275listener("pageChange", function ResourcePage_Conditional_15_Template_app_pagination_bar_pageChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.store().setPage($event));
    })("perPageChange", function ResourcePage_Conditional_15_Template_app_pagination_bar_perPageChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.store().setPerPage($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("pagination", ctx_r0.store().pagination())("loadedCount", ctx_r0.store().items().length)("disabled", ctx_r0.store().isRefreshing());
  }
}
var ResourcePage = class _ResourcePage {
  store = input.required(...ngDevMode ? [{ debugName: "store" }] : (
    /* istanbul ignore next */
    []
  ));
  columns = input.required(...ngDevMode ? [{ debugName: "columns" }] : (
    /* istanbul ignore next */
    []
  ));
  rowKey = input.required(...ngDevMode ? [{ debugName: "rowKey" }] : (
    /* istanbul ignore next */
    []
  ));
  title = input.required(...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  subtitle = input(null, ...ngDevMode ? [{ debugName: "subtitle" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Accessible caption for the table, e.g. "Lista de clientes". */
  caption = input.required(...ngDevMode ? [{ debugName: "caption" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Destination for each row. Omit for a read-only list. */
  rowLink = input(null, ...ngDevMode ? [{ debugName: "rowLink" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Accessible name for each row's link, e.g. "Ver Ana Silva". */
  rowLabel = input(null, ...ngDevMode ? [{ debugName: "rowLabel" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Omit to render no search box — right for a list the backend cannot search. */
  searchLabel = input(null, ...ngDevMode ? [{ debugName: "searchLabel" }] : (
    /* istanbul ignore next */
    []
  ));
  searchPlaceholder = input("Pesquisar\u2026", ...ngDevMode ? [{ debugName: "searchPlaceholder" }] : (
    /* istanbul ignore next */
    []
  ));
  searchValue = input("", ...ngDevMode ? [{ debugName: "searchValue" }] : (
    /* istanbul ignore next */
    []
  ));
  search = output();
  /** First load: nothing has arrived yet, so the skeleton is the whole page. */
  showSkeleton = computed(() => this.store().status() === "loading" && this.store().items().length === 0, ...ngDevMode ? [{ debugName: "showSkeleton" }] : (
    /* istanbul ignore next */
    []
  ));
  showError = computed(() => this.store().status() === "error", ...ngDevMode ? [{ debugName: "showError" }] : (
    /* istanbul ignore next */
    []
  ));
  showEmpty = computed(() => this.store().isEmpty(), ...ngDevMode ? [{ debugName: "showEmpty" }] : (
    /* istanbul ignore next */
    []
  ));
  showTable = computed(() => !this.showSkeleton() && !this.showError() && !this.showEmpty(), ...ngDevMode ? [{ debugName: "showTable" }] : (
    /* istanbul ignore next */
    []
  ));
  emptyTitle = computed(() => this.store().isFiltered() ? "Sem resultados" : "Ainda n\xE3o h\xE1 registos", ...ngDevMode ? [{ debugName: "emptyTitle" }] : (
    /* istanbul ignore next */
    []
  ));
  emptyMessage = computed(() => this.store().isFiltered() ? "Tente alterar a pesquisa ou os filtros aplicados." : "Assim que existirem dados no OfficeGest, aparecem aqui.", ...ngDevMode ? [{ debugName: "emptyMessage" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function ResourcePage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ResourcePage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ResourcePage, selectors: [["app-resource-page"]], hostAttrs: [1, "block"], inputs: { store: [1, "store"], columns: [1, "columns"], rowKey: [1, "rowKey"], title: [1, "title"], subtitle: [1, "subtitle"], caption: [1, "caption"], rowLink: [1, "rowLink"], rowLabel: [1, "rowLabel"], searchLabel: [1, "searchLabel"], searchPlaceholder: [1, "searchPlaceholder"], searchValue: [1, "searchValue"] }, outputs: { search: "search" }, ngContentSelectors: _c1, decls: 16, vars: 6, consts: [[1, "flex", "flex-wrap", "items-end", "justify-between", "gap-4"], [1, "text-h2", "text-ink-950"], [1, "mt-1", "text-body", "text-ink-500"], [1, "mt-6", "flex", "flex-wrap", "items-center", "gap-3"], [1, "w-full", "sm:max-w-sm", 3, "label", "placeholder", "value"], ["role", "status", 1, "text-meta", "text-ink-400"], [1, "mt-6"], ["state", "loading", 3, "skeletonRows"], ["state", "error", "title", "N\xE3o foi poss\xEDvel carregar os dados", "actionLabel", "Tentar novamente", 3, "message"], ["state", "empty", 3, "title", "message", "actionLabel"], [1, "overflow-hidden", "rounded-xl", "bg-white", "shadow-card", "ring-1", "ring-ink-950/6", "lg:p-1"], [1, "mt-4", 3, "pagination", "loadedCount", "disabled"], [1, "w-full", "sm:max-w-sm", 3, "search", "label", "placeholder", "value"], ["state", "error", "title", "N\xE3o foi poss\xEDvel carregar os dados", "actionLabel", "Tentar novamente", 3, "action", "message"], ["state", "empty", 3, "action", "title", "message", "actionLabel"], [3, "columns", "rows", "rowKey", "caption", "refreshing", "rowLink", "rowLabel"], [1, "mt-4", 3, "pageChange", "perPageChange", "pagination", "loadedCount", "disabled"]], template: function ResourcePage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef(_c02);
      \u0275\u0275elementStart(0, "header", 0)(1, "div")(2, "h1", 1);
      \u0275\u0275text(3);
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(4, ResourcePage_Conditional_4_Template, 2, 1, "p", 2);
      \u0275\u0275elementEnd();
      \u0275\u0275projection(5);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 3);
      \u0275\u0275conditionalCreate(7, ResourcePage_Conditional_7_Template, 1, 3, "app-search-field", 4);
      \u0275\u0275projection(8, 1);
      \u0275\u0275conditionalCreate(9, ResourcePage_Conditional_9_Template, 2, 0, "p", 5);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(10, "div", 6);
      \u0275\u0275conditionalCreate(11, ResourcePage_Conditional_11_Template, 1, 1, "app-state-panel", 7)(12, ResourcePage_Conditional_12_Template, 1, 1, "app-state-panel", 8)(13, ResourcePage_Conditional_13_Template, 1, 3, "app-state-panel", 9)(14, ResourcePage_Conditional_14_Template, 2, 7, "div", 10);
      \u0275\u0275conditionalCreate(15, ResourcePage_Conditional_15_Template, 1, 3, "app-pagination-bar", 11);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_2_0;
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.title());
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.subtitle() ? 4 : -1);
      \u0275\u0275advance(3);
      \u0275\u0275conditional((tmp_2_0 = ctx.searchLabel()) ? 7 : -1, tmp_2_0);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.store().isRefreshing() ? 9 : -1);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.showSkeleton() ? 11 : ctx.showError() ? 12 : ctx.showEmpty() ? 13 : 14);
      \u0275\u0275advance(4);
      \u0275\u0275conditional(ctx.showTable() || ctx.showEmpty() ? 15 : -1);
    }
  }, dependencies: [DataTable, PaginationBar, SearchField, StatePanel], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ResourcePage, [{
    type: Component,
    args: [{ selector: "app-resource-page", changeDetection: ChangeDetectionStrategy.OnPush, imports: [DataTable, PaginationBar, SearchField, StatePanel], host: { class: "block" }, template: `<header class="flex flex-wrap items-end justify-between gap-4">
  <div>
    <h1 class="text-h2 text-ink-950">{{ title() }}</h1>
    @if (subtitle()) {
      <p class="mt-1 text-body text-ink-500">{{ subtitle() }}</p>
    }
  </div>

  <!-- Page-specific primary action, e.g. "Nova marca\xE7\xE3o". -->
  <ng-content select="[slot=actions]" />
</header>

<div class="mt-6 flex flex-wrap items-center gap-3">
  @if (searchLabel(); as label) {
    <app-search-field
      class="w-full sm:max-w-sm"
      [label]="label"
      [placeholder]="searchPlaceholder()"
      [value]="searchValue()"
      (search)="search.emit($event)"
    />
  }

  <!-- Page-specific filters, e.g. a status select or a date range. -->
  <ng-content select="[slot=filters]" />

  <!-- Announced politely so a screen-reader user learns the list is updating
       without being interrupted mid-sentence. -->
  @if (store().isRefreshing()) {
    <p class="text-meta text-ink-400" role="status">A atualizar\u2026</p>
  }
</div>

<div class="mt-6">
  @if (showSkeleton()) {
    <app-state-panel state="loading" [skeletonRows]="8" />
  } @else if (showError()) {
    <app-state-panel
      state="error"
      title="N\xE3o foi poss\xEDvel carregar os dados"
      [message]="store().error()?.message ?? null"
      actionLabel="Tentar novamente"
      (action)="store().reload()"
    />
  } @else if (showEmpty()) {
    <app-state-panel
      state="empty"
      [title]="emptyTitle()"
      [message]="emptyMessage()"
      [actionLabel]="store().isFiltered() ? null : 'Atualizar'"
      (action)="store().reload()"
    />
  } @else {
    <div class="overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-ink-950/6 lg:p-1">
      <app-data-table
        [columns]="columns()"
        [rows]="store().items()"
        [rowKey]="rowKey()"
        [caption]="caption()"
        [refreshing]="store().isRefreshing()"
        [rowLink]="rowLink()"
        [rowLabel]="rowLabel()"
      />
    </div>
  }

  @if (showTable() || showEmpty()) {
    <app-pagination-bar
      class="mt-4"
      [pagination]="store().pagination()"
      [loadedCount]="store().items().length"
      [disabled]="store().isRefreshing()"
      (pageChange)="store().setPage($event)"
      (perPageChange)="store().setPerPage($event)"
    />
  }
</div>
` }]
  }], null, { store: [{ type: Input, args: [{ isSignal: true, alias: "store", required: true }] }], columns: [{ type: Input, args: [{ isSignal: true, alias: "columns", required: true }] }], rowKey: [{ type: Input, args: [{ isSignal: true, alias: "rowKey", required: true }] }], title: [{ type: Input, args: [{ isSignal: true, alias: "title", required: true }] }], subtitle: [{ type: Input, args: [{ isSignal: true, alias: "subtitle", required: false }] }], caption: [{ type: Input, args: [{ isSignal: true, alias: "caption", required: true }] }], rowLink: [{ type: Input, args: [{ isSignal: true, alias: "rowLink", required: false }] }], rowLabel: [{ type: Input, args: [{ isSignal: true, alias: "rowLabel", required: false }] }], searchLabel: [{ type: Input, args: [{ isSignal: true, alias: "searchLabel", required: false }] }], searchPlaceholder: [{ type: Input, args: [{ isSignal: true, alias: "searchPlaceholder", required: false }] }], searchValue: [{ type: Input, args: [{ isSignal: true, alias: "searchValue", required: false }] }], search: [{ type: Output, args: ["search"] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ResourcePage, { className: "ResourcePage", filePath: "src/app/features/private/officegest/components/resource-page/resource-page.ts", lineNumber: 37 });
})();

export {
  createResourceList,
  ResourcePage
};
//# sourceMappingURL=chunk-FAVO3ITR.js.map
