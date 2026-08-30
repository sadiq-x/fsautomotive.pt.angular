import {
  DetailList,
  DetailPage,
  createResourceDetail
} from "./chunk-FHBZRBXP.js";
import {
  formatDate,
  formatMileage,
  formatPlate,
  orNull
} from "./chunk-2LZNZMJ7.js";
import {
  UiButton
} from "./chunk-NGHYTC22.js";
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
  Input,
  RouterLink,
  computed,
  inject,
  input,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵproperty,
  ɵɵtext
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/officegest/pages/vehicles/vehicle-detail.ts
var VehicleDetail = class _VehicleDetail {
  /** Bound from the `:plate` route parameter. */
  plate = input.required(...ngDevMode ? [{ debugName: "plate" }] : (
    /* istanbul ignore next */
    []
  ));
  officegest = inject(OfficeGestService);
  routes = PRIVATE_ROUTES;
  store = createResourceDetail({
    id: this.plate,
    fetch: (plate) => this.officegest.getVehicle(plate)
  });
  formattedPlate = computed(() => formatPlate(this.store.data()?.plate ?? this.plate()) ?? "", ...ngDevMode ? [{ debugName: "formattedPlate" }] : (
    /* istanbul ignore next */
    []
  ));
  subtitle = computed(() => {
    const vehicle = this.store.data();
    if (!vehicle) {
      return null;
    }
    return orNull([vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" "));
  }, ...ngDevMode ? [{ debugName: "subtitle" }] : (
    /* istanbul ignore next */
    []
  ));
  fields = computed(() => {
    const vehicle = this.store.data();
    if (!vehicle) {
      return [];
    }
    return [
      { label: "Matr\xEDcula", value: formatPlate(vehicle.plate) },
      { label: "Marca", value: orNull(vehicle.brand) },
      { label: "Modelo", value: orNull(vehicle.model) },
      { label: "Vers\xE3o", value: orNull(vehicle.version) },
      { label: "Ano", value: vehicle.year ? String(vehicle.year) : null },
      { label: "Combust\xEDvel", value: orNull(vehicle.fuel) },
      { label: "Quil\xF3metros", value: formatMileage(vehicle.mileage) },
      { label: "Chassis (VIN)", value: orNull(vehicle.vin) },
      { label: "\xDAltima interven\xE7\xE3o", value: formatDate(vehicle.lastServiceAt) }
    ];
  }, ...ngDevMode ? [{ debugName: "fields" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function VehicleDetail_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _VehicleDetail)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _VehicleDetail, selectors: [["app-vehicle-detail"]], inputs: { plate: [1, "plate"] }, decls: 8, vars: 7, consts: [["backLabel", "Ve\xEDculos", "missingMessage", "N\xE3o existe nenhum ve\xEDculo com esta matr\xEDcula no OfficeGest.", 3, "status", "title", "subtitle", "backLink", "errorMessage"], [1, "rounded-xl", "bg-white", "p-6", "shadow-card", "ring-1", "ring-ink-950/6"], [1, "flex", "flex-wrap", "items-center", "justify-between", "gap-3"], [1, "text-h3", "text-ink-900"], ["variant", "secondary", "size", "sm", "icon", "clipboard-list", "iconPosition", "left", 3, "routerLink"], [1, "mt-5", 3, "fields"]], template: function VehicleDetail_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "app-detail-page", 0)(1, "section", 1)(2, "div", 2)(3, "h2", 3);
      \u0275\u0275text(4, "Dados do ve\xEDculo");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "app-button", 4);
      \u0275\u0275text(6, "Folhas de obra");
      \u0275\u0275elementEnd()();
      \u0275\u0275element(7, "app-detail-list", 5);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      let tmp_4_0;
      \u0275\u0275property("status", ctx.store.status())("title", ctx.formattedPlate())("subtitle", ctx.subtitle())("backLink", ctx.routes.vehicles)("errorMessage", ((tmp_4_0 = ctx.store.error()) == null ? null : tmp_4_0.message) ?? null);
      \u0275\u0275advance(5);
      \u0275\u0275property("routerLink", ctx.routes.serviceOrders);
      \u0275\u0275advance(2);
      \u0275\u0275property("fields", ctx.fields());
    }
  }, dependencies: [DetailList, DetailPage, RouterLink, UiButton], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(VehicleDetail, [{
    type: Component,
    args: [{
      selector: "app-vehicle-detail",
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [DetailList, DetailPage, RouterLink, UiButton],
      template: `
    <app-detail-page
      [status]="store.status()"
      [title]="formattedPlate()"
      [subtitle]="subtitle()"
      [backLink]="routes.vehicles"
      backLabel="Ve\xEDculos"
      [errorMessage]="store.error()?.message ?? null"
      missingMessage="N\xE3o existe nenhum ve\xEDculo com esta matr\xEDcula no OfficeGest."
    >
      <section class="rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-h3 text-ink-900">Dados do ve\xEDculo</h2>
          <app-button
            variant="secondary"
            size="sm"
            icon="clipboard-list"
            iconPosition="left"
            [routerLink]="routes.serviceOrders"
            >Folhas de obra</app-button
          >
        </div>
        <app-detail-list class="mt-5" [fields]="fields()" />
      </section>
    </app-detail-page>
  `
    }]
  }], null, { plate: [{ type: Input, args: [{ isSignal: true, alias: "plate", required: true }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(VehicleDetail, { className: "VehicleDetail", filePath: "src/app/features/private/officegest/pages/vehicles/vehicle-detail.ts", lineNumber: 50 });
})();
export {
  VehicleDetail
};
//# sourceMappingURL=chunk-XQ67F2Q7.js.map
