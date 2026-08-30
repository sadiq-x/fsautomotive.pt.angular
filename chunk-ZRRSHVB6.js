import {
  DetailList,
  DetailPage,
  createResourceDetail
} from "./chunk-FHBZRBXP.js";
import {
  formatCurrency,
  formatDate,
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
  Input,
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

// src/app/features/private/officegest/pages/service-orders/service-order-detail.ts
var ServiceOrderDetail = class _ServiceOrderDetail {
  /** Bound from the `:serviceOrderId` route parameter. */
  serviceOrderId = input.required(...ngDevMode ? [{ debugName: "serviceOrderId" }] : (
    /* istanbul ignore next */
    []
  ));
  officegest = inject(OfficeGestService);
  routes = PRIVATE_ROUTES;
  store = createResourceDetail({
    id: this.serviceOrderId,
    fetch: (id) => this.officegest.getServiceOrder(id)
  });
  title = computed(() => {
    const order = this.store.data();
    return order ? `Folha de obra ${order.number ?? order.id}` : "";
  }, ...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  subtitle = computed(() => formatPlate(this.store.data()?.plate), ...ngDevMode ? [{ debugName: "subtitle" }] : (
    /* istanbul ignore next */
    []
  ));
  fields = computed(() => {
    const order = this.store.data();
    if (!order) {
      return [];
    }
    return [
      { label: "N\xFAmero", value: orNull(order.number ?? order.id) },
      { label: "Matr\xEDcula", value: formatPlate(order.plate) },
      { label: "Estado", value: orNull(order.status), badge: true },
      { label: "Abertura", value: formatDate(order.openedAt) },
      { label: "Fecho", value: formatDate(order.closedAt) },
      { label: "Total", value: formatCurrency(order.total) },
      { label: "Descri\xE7\xE3o", value: orNull(order.description), wide: true }
    ];
  }, ...ngDevMode ? [{ debugName: "fields" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function ServiceOrderDetail_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ServiceOrderDetail)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ServiceOrderDetail, selectors: [["app-service-order-detail"]], inputs: { serviceOrderId: [1, "serviceOrderId"] }, decls: 5, vars: 6, consts: [["backLabel", "Folhas de obra", "missingMessage", "Esta folha de obra n\xE3o existe no OfficeGest ou foi removida.", 3, "status", "title", "subtitle", "backLink", "errorMessage"], [1, "rounded-xl", "bg-white", "p-6", "shadow-card", "ring-1", "ring-ink-950/6"], [1, "text-h3", "text-ink-900"], [1, "mt-5", 3, "fields"]], template: function ServiceOrderDetail_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "app-detail-page", 0)(1, "section", 1)(2, "h2", 2);
      \u0275\u0275text(3, "Dados da interven\xE7\xE3o");
      \u0275\u0275elementEnd();
      \u0275\u0275element(4, "app-detail-list", 3);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      let tmp_4_0;
      \u0275\u0275property("status", ctx.store.status())("title", ctx.title())("subtitle", ctx.subtitle())("backLink", ctx.routes.serviceOrders)("errorMessage", ((tmp_4_0 = ctx.store.error()) == null ? null : tmp_4_0.message) ?? null);
      \u0275\u0275advance(4);
      \u0275\u0275property("fields", ctx.fields());
    }
  }, dependencies: [DetailList, DetailPage], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ServiceOrderDetail, [{
    type: Component,
    args: [{
      selector: "app-service-order-detail",
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [DetailList, DetailPage],
      template: `
    <app-detail-page
      [status]="store.status()"
      [title]="title()"
      [subtitle]="subtitle()"
      [backLink]="routes.serviceOrders"
      backLabel="Folhas de obra"
      [errorMessage]="store.error()?.message ?? null"
      missingMessage="Esta folha de obra n\xE3o existe no OfficeGest ou foi removida."
    >
      <section class="rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
        <h2 class="text-h3 text-ink-900">Dados da interven\xE7\xE3o</h2>
        <app-detail-list class="mt-5" [fields]="fields()" />
      </section>
    </app-detail-page>
  `
    }]
  }], null, { serviceOrderId: [{ type: Input, args: [{ isSignal: true, alias: "serviceOrderId", required: true }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ServiceOrderDetail, { className: "ServiceOrderDetail", filePath: "src/app/features/private/officegest/pages/service-orders/service-order-detail.ts", lineNumber: 32 });
})();
export {
  ServiceOrderDetail
};
//# sourceMappingURL=chunk-ZRRSHVB6.js.map
