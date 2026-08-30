import {
  DetailList,
  DetailPage,
  createResourceDetail
} from "./chunk-FHBZRBXP.js";
import {
  formatActive,
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

// src/app/features/private/officegest/pages/customers/customer-detail.ts
var CustomerDetail = class _CustomerDetail {
  /** Bound from the `:customerId` route parameter. */
  customerId = input.required(...ngDevMode ? [{ debugName: "customerId" }] : (
    /* istanbul ignore next */
    []
  ));
  officegest = inject(OfficeGestService);
  routes = PRIVATE_ROUTES;
  store = createResourceDetail({
    id: this.customerId,
    fetch: (id) => this.officegest.getCustomer(id)
  });
  subtitle = computed(() => {
    const customer = this.store.data();
    return customer ? `Cliente #${customer.id}` : null;
  }, ...ngDevMode ? [{ debugName: "subtitle" }] : (
    /* istanbul ignore next */
    []
  ));
  fields = computed(() => {
    const customer = this.store.data();
    if (!customer) {
      return [];
    }
    return [
      { label: "Nome", value: orNull(customer.name) },
      { label: "NIF", value: orNull(customer.taxId) },
      {
        label: "E-mail",
        value: orNull(customer.email),
        href: customer.email ? `mailto:${customer.email}` : void 0
      },
      {
        label: "Telefone",
        value: orNull(customer.phone),
        href: customer.phone ? `tel:${customer.phone}` : void 0
      },
      {
        label: "Telem\xF3vel",
        value: orNull(customer.mobile),
        href: customer.mobile ? `tel:${customer.mobile}` : void 0
      },
      { label: "Localidade", value: orNull(customer.city) },
      { label: "C\xF3digo postal", value: orNull(customer.postalCode) },
      { label: "Pa\xEDs", value: orNull(customer.country) },
      { label: "Estado", value: formatActive(customer.active), badge: true }
    ];
  }, ...ngDevMode ? [{ debugName: "fields" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function CustomerDetail_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CustomerDetail)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CustomerDetail, selectors: [["app-customer-detail"]], inputs: { customerId: [1, "customerId"] }, decls: 5, vars: 6, consts: [["backLabel", "Clientes", "missingMessage", "Este cliente n\xE3o existe no OfficeGest ou foi removido.", 3, "status", "title", "subtitle", "backLink", "errorMessage"], [1, "rounded-xl", "bg-white", "p-6", "shadow-card", "ring-1", "ring-ink-950/6"], [1, "text-h3", "text-ink-900"], [1, "mt-5", 3, "fields"]], template: function CustomerDetail_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "app-detail-page", 0)(1, "section", 1)(2, "h2", 2);
      \u0275\u0275text(3, "Dados do cliente");
      \u0275\u0275elementEnd();
      \u0275\u0275element(4, "app-detail-list", 3);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      let tmp_1_0;
      let tmp_4_0;
      \u0275\u0275property("status", ctx.store.status())("title", ((tmp_1_0 = ctx.store.data()) == null ? null : tmp_1_0.name) ?? "")("subtitle", ctx.subtitle())("backLink", ctx.routes.customers)("errorMessage", ((tmp_4_0 = ctx.store.error()) == null ? null : tmp_4_0.message) ?? null);
      \u0275\u0275advance(4);
      \u0275\u0275property("fields", ctx.fields());
    }
  }, dependencies: [DetailList, DetailPage], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CustomerDetail, [{
    type: Component,
    args: [{
      selector: "app-customer-detail",
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [DetailList, DetailPage],
      template: `
    <app-detail-page
      [status]="store.status()"
      [title]="store.data()?.name ?? ''"
      [subtitle]="subtitle()"
      [backLink]="routes.customers"
      backLabel="Clientes"
      [errorMessage]="store.error()?.message ?? null"
      missingMessage="Este cliente n\xE3o existe no OfficeGest ou foi removido."
    >
      <section class="rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
        <h2 class="text-h3 text-ink-900">Dados do cliente</h2>
        <app-detail-list class="mt-5" [fields]="fields()" />
      </section>
    </app-detail-page>
  `
    }]
  }], null, { customerId: [{ type: Input, args: [{ isSignal: true, alias: "customerId", required: true }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CustomerDetail, { className: "CustomerDetail", filePath: "src/app/features/private/officegest/pages/customers/customer-detail.ts", lineNumber: 39 });
})();
export {
  CustomerDetail
};
//# sourceMappingURL=chunk-YSWQP4BF.js.map
