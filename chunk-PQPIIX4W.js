import {
  ResourcePage,
  createResourceList
} from "./chunk-FAVO3ITR.js";
import {
  formatCurrency,
  formatDate,
  formatPlate,
  orNull
} from "./chunk-2LZNZMJ7.js";
import {
  DefaultValueAccessor,
  FormsModule,
  MaxLengthValidator,
  NgControlStatus,
  NgModel
} from "./chunk-VLMDAFYN.js";
import "./chunk-NGHYTC22.js";
import {
  OfficeGestService
} from "./chunk-QHRJKSEM.js";
import "./chunk-TZW5CK7K.js";
import "./chunk-4AV4IBWC.js";
import {
  PRIVATE_ROUTES
} from "./chunk-GUS6C3RU.js";
import "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵproperty,
  ɵɵtext
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/officegest/pages/service-orders/service-orders.ts
var ServiceOrders = class _ServiceOrders {
  officegest = inject(OfficeGestService);
  store = createResourceList({
    fetch: (query) => this.officegest.listServiceOrders(query),
    initialFilters: {}
  });
  rowKey = (order) => order.id;
  rowLink = (order) => PRIVATE_ROUTES.serviceOrder(order.id);
  rowLabel = (order) => `Ver folha de obra ${order.number ?? order.id}`;
  columns = [
    {
      key: "number",
      header: "N\xBA",
      value: (order) => orNull(order.number ?? order.id),
      sortValue: (order) => order.number ?? order.id,
      priority: "primary"
    },
    {
      key: "plate",
      header: "Matr\xEDcula",
      value: (order) => formatPlate(order.plate),
      sortValue: (order) => order.plate ?? null,
      priority: "secondary"
    },
    {
      key: "description",
      header: "Descri\xE7\xE3o",
      value: (order) => orNull(order.description),
      priority: "hidden"
    },
    {
      key: "openedAt",
      header: "Abertura",
      value: (order) => formatDate(order.openedAt),
      sortValue: (order) => order.openedAt ?? null
    },
    {
      key: "status",
      header: "Estado",
      value: (order) => orNull(order.status),
      sortValue: (order) => order.status ?? null,
      badge: true
    },
    {
      key: "total",
      header: "Total",
      value: (order) => formatCurrency(order.total),
      sortValue: (order) => order.total ?? null,
      align: "end",
      numeric: true
    }
  ];
  /**
   * The backend normalises the plate itself, but sending a partial one would
   * return nothing — so the filter is only applied once it is plausibly whole.
   */
  onPlate(raw) {
    const normalised = raw.toUpperCase().replace(/[\s._-]/g, "");
    this.store.setFilters({
      plate: normalised.length === 6 ? normalised : void 0
    });
  }
  static \u0275fac = function ServiceOrders_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ServiceOrders)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ServiceOrders, selectors: [["app-service-orders"]], decls: 10, vars: 7, consts: [["title", "Folhas de obra", "subtitle", "Interven\xE7\xF5es registadas no OfficeGest.", "caption", "Lista de folhas de obra", 3, "store", "columns", "rowKey", "rowLink", "rowLabel"], ["slot", "filters", 1, "flex", "flex-wrap", "items-center", "gap-3"], [1, "flex", "items-center", "gap-2"], [1, "sr-only"], ["type", "text", "inputmode", "text", "maxlength", "16", "placeholder", "Matr\xEDcula (AA-00-BB)", 1, "w-48", "rounded-full", "border-0", "bg-white", "px-4", "py-2.5", "text-body", "text-ink-900", "uppercase", "shadow-btn", "ring-1", "ring-ink-950/8", "ring-inset", "placeholder:text-ink-400", "placeholder:normal-case", "focus:ring-2", "focus:ring-brand-600", "focus:outline-none", 3, "ngModelChange", "ngModel"], ["type", "text", "maxlength", "40", "placeholder", "Estado", 1, "w-40", "rounded-full", "border-0", "bg-white", "px-4", "py-2.5", "text-body", "text-ink-900", "shadow-btn", "ring-1", "ring-ink-950/8", "ring-inset", "placeholder:text-ink-400", "focus:ring-2", "focus:ring-brand-600", "focus:outline-none", 3, "ngModelChange", "ngModel"]], template: function ServiceOrders_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "app-resource-page", 0)(1, "div", 1)(2, "label", 2)(3, "span", 3);
      \u0275\u0275text(4, "Filtrar por matr\xEDcula");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "input", 4);
      \u0275\u0275listener("ngModelChange", function ServiceOrders_Template_input_ngModelChange_5_listener($event) {
        return ctx.onPlate($event);
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(6, "label", 2)(7, "span", 3);
      \u0275\u0275text(8, "Filtrar por estado");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "input", 5);
      \u0275\u0275listener("ngModelChange", function ServiceOrders_Template_input_ngModelChange_9_listener($event) {
        return ctx.store.setFilters({ status: $event || void 0 });
      });
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      \u0275\u0275property("store", ctx.store)("columns", ctx.columns)("rowKey", ctx.rowKey)("rowLink", ctx.rowLink)("rowLabel", ctx.rowLabel);
      \u0275\u0275advance(5);
      \u0275\u0275property("ngModel", ctx.store.filters().plate ?? "");
      \u0275\u0275advance(4);
      \u0275\u0275property("ngModel", ctx.store.filters().status ?? "");
    }
  }, dependencies: [FormsModule, DefaultValueAccessor, NgControlStatus, MaxLengthValidator, NgModel, ResourcePage], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ServiceOrders, [{
    type: Component,
    args: [{
      selector: "app-service-orders",
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [FormsModule, ResourcePage],
      template: `
    <app-resource-page
      title="Folhas de obra"
      subtitle="Interven\xE7\xF5es registadas no OfficeGest."
      caption="Lista de folhas de obra"
      [store]="store"
      [columns]="columns"
      [rowKey]="rowKey"
      [rowLink]="rowLink"
      [rowLabel]="rowLabel"
    >
      <div slot="filters" class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2">
          <span class="sr-only">Filtrar por matr\xEDcula</span>
          <input
            type="text"
            inputmode="text"
            maxlength="16"
            placeholder="Matr\xEDcula (AA-00-BB)"
            class="w-48 rounded-full border-0 bg-white px-4 py-2.5 text-body text-ink-900 uppercase shadow-btn ring-1 ring-ink-950/8 ring-inset placeholder:text-ink-400 placeholder:normal-case focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="store.filters().plate ?? ''"
            (ngModelChange)="onPlate($event)"
          />
        </label>

        <label class="flex items-center gap-2">
          <span class="sr-only">Filtrar por estado</span>
          <input
            type="text"
            maxlength="40"
            placeholder="Estado"
            class="w-40 rounded-full border-0 bg-white px-4 py-2.5 text-body text-ink-900 shadow-btn ring-1 ring-ink-950/8 ring-inset placeholder:text-ink-400 focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="store.filters().status ?? ''"
            (ngModelChange)="store.setFilters({ status: $event || undefined })"
          />
        </label>
      </div>
    </app-resource-page>
  `
    }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ServiceOrders, { className: "ServiceOrders", filePath: "src/app/features/private/officegest/pages/service-orders/service-orders.ts", lineNumber: 72 });
})();
export {
  ServiceOrders
};
//# sourceMappingURL=chunk-PQPIIX4W.js.map
