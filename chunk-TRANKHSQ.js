import {
  ResourcePage,
  createResourceList
} from "./chunk-FAVO3ITR.js";
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
  inject,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵproperty
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/officegest/pages/customers/customers.ts
var Customers = class _Customers {
  officegest = inject(OfficeGestService);
  store = createResourceList({
    fetch: (query) => this.officegest.listCustomers(query),
    initialFilters: {}
  });
  rowKey = (customer) => customer.id;
  rowLink = (customer) => PRIVATE_ROUTES.customer(customer.id);
  rowLabel = (customer) => `Ver ${customer.name}`;
  columns = [
    {
      key: "name",
      header: "Nome",
      value: (customer) => orNull(customer.name),
      sortValue: (customer) => customer.name,
      priority: "primary"
    },
    {
      key: "taxId",
      header: "NIF",
      value: (customer) => orNull(customer.taxId),
      sortValue: (customer) => customer.taxId ?? null,
      priority: "secondary"
    },
    {
      key: "email",
      header: "E-mail",
      value: (customer) => orNull(customer.email),
      sortValue: (customer) => customer.email ?? null
    },
    {
      key: "phone",
      header: "Telefone",
      // Either number is the one the workshop would ring; showing whichever
      // exists beats an empty column and a second one nobody reads.
      value: (customer) => orNull(customer.mobile ?? customer.phone)
    },
    { key: "city", header: "Localidade", value: (customer) => orNull(customer.city) },
    {
      key: "active",
      header: "Estado",
      value: (customer) => formatActive(customer.active),
      badge: true,
      align: "end"
    }
  ];
  static \u0275fac = function Customers_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Customers)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Customers, selectors: [["app-customers"]], decls: 1, vars: 6, consts: [["title", "Clientes", "subtitle", "Base de clientes sincronizada com o OfficeGest.", "caption", "Lista de clientes", "searchLabel", "Pesquisar clientes", "searchPlaceholder", "Nome, NIF ou e-mail\u2026", 3, "search", "searchValue", "store", "columns", "rowKey", "rowLink", "rowLabel"]], template: function Customers_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "app-resource-page", 0);
      \u0275\u0275listener("search", function Customers_Template_app_resource_page_search_0_listener($event) {
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
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Customers, [{
    type: Component,
    args: [{
      selector: "app-customers",
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [ResourcePage],
      template: `
    <app-resource-page
      title="Clientes"
      subtitle="Base de clientes sincronizada com o OfficeGest."
      caption="Lista de clientes"
      searchLabel="Pesquisar clientes"
      searchPlaceholder="Nome, NIF ou e-mail\u2026"
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
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Customers, { className: "Customers", filePath: "src/app/features/private/officegest/pages/customers/customers.ts", lineNumber: 47 });
})();
export {
  Customers
};
//# sourceMappingURL=chunk-TRANKHSQ.js.map
