import {
  ResourcePage,
  createResourceList
} from "./chunk-FAVO3ITR.js";
import {
  formatDate,
  formatMileage,
  formatPlate,
  orNull
} from "./chunk-2LZNZMJ7.js";
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
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵproperty
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/officegest/pages/vehicles/vehicles.ts
var Vehicles = class _Vehicles {
  officegest = inject(OfficeGestService);
  store = createResourceList({
    fetch: (query) => this.officegest.listVehicles(query),
    initialFilters: {}
  });
  rowKey = (vehicle) => vehicle.plate;
  rowLink = (vehicle) => PRIVATE_ROUTES.vehicle(vehicle.plate);
  rowLabel = (vehicle) => `Ver ve\xEDculo ${formatPlate(vehicle.plate)}`;
  columns = [
    {
      key: "plate",
      header: "Matr\xEDcula",
      value: (vehicle) => formatPlate(vehicle.plate),
      sortValue: (vehicle) => vehicle.plate,
      priority: "primary"
    },
    {
      key: "vehicle",
      header: "Marca e modelo",
      value: (vehicle) => orNull([vehicle.brand, vehicle.model].filter(Boolean).join(" ")),
      sortValue: (vehicle) => vehicle.brand ?? null,
      priority: "secondary"
    },
    {
      key: "year",
      header: "Ano",
      value: (vehicle) => vehicle.year ? String(vehicle.year) : null,
      sortValue: (vehicle) => vehicle.year ?? null,
      numeric: true
    },
    { key: "fuel", header: "Combust\xEDvel", value: (vehicle) => orNull(vehicle.fuel) },
    {
      key: "mileage",
      header: "Quil\xF3metros",
      value: (vehicle) => formatMileage(vehicle.mileage),
      sortValue: (vehicle) => vehicle.mileage ?? null,
      align: "end",
      numeric: true
    },
    {
      key: "lastServiceAt",
      header: "\xDAltima interven\xE7\xE3o",
      value: (vehicle) => formatDate(vehicle.lastServiceAt),
      sortValue: (vehicle) => vehicle.lastServiceAt ?? null,
      align: "end"
    }
  ];
  static \u0275fac = function Vehicles_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Vehicles)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Vehicles, selectors: [["app-vehicles"]], decls: 1, vars: 6, consts: [["title", "Ve\xEDculos", "subtitle", "Viaturas registadas na oficina.", "caption", "Lista de ve\xEDculos", "searchLabel", "Pesquisar ve\xEDculos", "searchPlaceholder", "Matr\xEDcula, marca ou modelo\u2026", 3, "search", "searchValue", "store", "columns", "rowKey", "rowLink", "rowLabel"]], template: function Vehicles_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "app-resource-page", 0);
      \u0275\u0275listener("search", function Vehicles_Template_app_resource_page_search_0_listener($event) {
        return ctx.store.setFilters({ search: $event || void 0 });
      });
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275property("searchValue", ctx.store.filters().search ?? "")("store", ctx.store)("columns", ctx.columns)("rowKey", ctx.rowKey)("rowLink", ctx.rowLink)("rowLabel", ctx.rowLabel);
    }
  }, dependencies: [ResourcePage], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Vehicles, [{
    type: Component,
    args: [{
      selector: "app-vehicles",
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [ResourcePage],
      template: `
    <app-resource-page
      title="Ve\xEDculos"
      subtitle="Viaturas registadas na oficina."
      caption="Lista de ve\xEDculos"
      searchLabel="Pesquisar ve\xEDculos"
      searchPlaceholder="Matr\xEDcula, marca ou modelo\u2026"
      [searchValue]="store.filters().search ?? ''"
      [store]="store"
      [columns]="columns"
      [rowKey]="rowKey"
      [rowLink]="rowLink"
      [rowLabel]="rowLabel"
      (search)="store.setFilters({ search: $event || undefined })"
    />
  `
    }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Vehicles, { className: "Vehicles", filePath: "src/app/features/private/officegest/pages/vehicles/vehicles.ts", lineNumber: 37 });
})();
export {
  Vehicles
};
//# sourceMappingURL=chunk-VLU2SMPI.js.map
